import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { AppError, conflict, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import {
  attachmentStorageDirectory,
  attachmentStoragePath,
} from "./attachment-storage";
import { getSubmission } from "./submission-service";

const allowedTypes = new Map([
  ["application/pdf", ".pdf"],
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
]);
const maxAttachmentCount = 10;
const defaultMaxBytes = 10 * 1024 * 1024;
const absoluteMaxBytes = 25 * 1024 * 1024;
function maxBytes() {
  const configured = Number(process.env.ATTACHMENT_MAX_BYTES);
  if (!Number.isSafeInteger(configured) || configured <= 0)
    return defaultMaxBytes;
  return Math.min(configured, absoluteMaxBytes);
}

function hasValidSignature(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "application/pdf")
    return Buffer.from(bytes.subarray(0, 5)).toString("ascii") === "%PDF-";
  if (mimeType === "image/png")
    return Buffer.from(bytes.subarray(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  if (mimeType === "image/jpeg")
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return false;
}

function sanitizeFilename(filename: string) {
  const sanitized = filename.replace(/[\\/\u0000-\u001f\u007f]/g, "_").trim();
  if (!sanitized || sanitized.length > 255)
    throw new AppError("Nama file tidak valid", 400, "INVALID_FILENAME");
  return sanitized;
}

export async function storeAttachment(
  user: SessionUser,
  submissionId: string,
  file: File,
) {
  const submission = await getSubmission(user, submissionId);
  if (submission.requesterId !== user.id) throw forbidden();
  if (submission.status !== "DRAFT" && submission.status !== "NEEDS_REVISION") {
    throw conflict("Lampiran hanya dapat ditambahkan pada draft atau revisi");
  }
  if (submission.attachments.length >= maxAttachmentCount)
    throw conflict("Maksimal 10 lampiran per pengajuan");
  if (file.size < 1 || file.size > maxBytes())
    throw new AppError("Ukuran file melewati batas", 413, "FILE_TOO_LARGE");

  const extension = allowedTypes.get(file.type);
  const fileExtension = path.extname(file.name).toLowerCase();
  if (
    !extension ||
    (fileExtension !== extension &&
      !(file.type === "image/jpeg" && fileExtension === ".jpeg"))
  ) {
    throw new AppError(
      "Format lampiran yang diterima: PDF, PNG, dan JPG",
      400,
      "INVALID_FILE_TYPE",
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(file.type, bytes))
    throw new AppError(
      "Isi file tidak sesuai dengan tipe yang dikirim",
      400,
      "INVALID_FILE_CONTENT",
    );

  const storageKey = `attachments/${submissionId}/${randomUUID()}${extension}`;
  const directory = attachmentStorageDirectory();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const fullPath = attachmentStoragePath(storageKey);
  const handle = await open(/*turbopackIgnore: true*/ fullPath, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.close();
  } catch (err) {
    await handle.close().catch(() => undefined);
    await unlink(fullPath).catch(() => undefined);
    throw err;
  }

  try {
    const attachment = await prisma.$transaction(
      async (tx) => {
        const count = await tx.attachment.count({ where: { submissionId } });
        if (count >= maxAttachmentCount)
          throw conflict("Maksimal 10 lampiran per pengajuan");

        const created = await tx.attachment.create({
          data: {
            submissionId,
            originalFilename: sanitizeFilename(file.name),
            storageKey,
            mimeType: file.type,
            sizeBytes: bytes.byteLength,
            uploadedById: user.id,
          },
          select: {
            id: true,
            originalFilename: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        });
        await tx.approvalAction.create({
          data: {
            submissionId,
            actorId: user.id,
            action: "EDITED",
            resultingStatus: submission.status,
            snapshot: {
              attachmentId: created.id,
              filename: created.originalFilename,
            },
          },
        });
        return created;
      },
      { isolationLevel: "Serializable" },
    );

    return attachment;
  } catch (error) {
    await unlink(fullPath).catch(() => undefined);
    throw error;
  }
}

export async function readAttachment(
  user: SessionUser,
  submissionId: string,
  attachmentId: string,
) {
  const submission = await getSubmission(user, submissionId);
  const attachment = submission.attachments.find(
    (item) => item.id === attachmentId,
  );
  if (!attachment) throw notFound();

  const record = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { storageKey: true },
  });
  if (!record) throw notFound();

  try {
    const bytes = await readFile(
      /*turbopackIgnore: true*/ attachmentStoragePath(record.storageKey),
    );
    return {
      bytes,
      filename: attachment.originalFilename,
      mimeType: attachment.mimeType,
    };
  } catch {
    throw notFound();
  }
}
