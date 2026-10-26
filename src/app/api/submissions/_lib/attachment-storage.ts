import "server-only";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/lib/errors";

export function attachmentStorageDirectory() {
  const directory = path.resolve(
    /*turbopackIgnore: true*/ process.env.ATTACHMENT_STORAGE_DIR ??
      path.join(process.cwd(), "private", "attachments"),
  );
  const publicDirectory = path.resolve(process.cwd(), "public");
  const relative = path.relative(publicDirectory, directory);

  if (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  ) {
    throw new AppError(
      "Penyimpanan lampiran tidak boleh berada di dalam public",
      500,
      "INVALID_STORAGE_CONFIG",
    );
  }

  return directory;
}

export function attachmentStoragePath(storageKey: string) {
  return path.join(
    /*turbopackIgnore: true*/ attachmentStorageDirectory(),
    path.basename(storageKey),
  );
}

export async function removeAttachmentFiles(storageKeys: string[]) {
  await Promise.all(
    storageKeys.map(async (storageKey) => {
      try {
        await unlink(/*turbopackIgnore: true*/ attachmentStoragePath(storageKey));
      } catch {
        return undefined;
      }
    }),
  );
}
