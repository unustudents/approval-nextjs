import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma, Role, SubmissionStatus, WorkflowStep } from "@/generated/prisma/client";
import { AppError, conflict, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";

const submissionInclude = {
  requester: { select: { id: true, username: true, name: true, role: true } },
  unit: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  items: true,
  currentStep: { select: { id: true, order: true, type: true, targetType: true, targetRole: true, targetUser: { select: { id: true, name: true } } } },
  actions: {
    orderBy: { createdAt: "asc" as const },
    include: { actor: { select: { id: true, name: true, role: true } }, submissionStep: { select: { order: true, type: true } } },
  },
  revisions: {
    orderBy: { createdAt: "asc" as const },
    include: { editedBy: { select: { id: true, name: true } } },
  },
  attachments: { select: { id: true, originalFilename: true, mimeType: true, sizeBytes: true, createdAt: true } },
};

function statusForStep(step: Pick<WorkflowStep, "type" | "targetType" | "targetRole">): SubmissionStatus {
  if (step.targetType === "UNIT_MANAGER") return "WAITING_UNIT_MANAGER";
  if (step.type === "CONSIDERATION") return "WAITING_CONSIDERATION";
  return step.targetRole === "FINANCE_APPROVER" ? "WAITING_FINANCE" : "WAITING_APPROVAL";
}

function itemData(items: Array<{ name: string; quantity: number; description: string }>) {
  return items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    description: item.description,
  }));
}

async function notifyStep(
  tx: Prisma.TransactionClient,
  submissionId: string,
  number: string,
  step: { targetType: string; targetRole: Role | null; targetUserId: string | null },
) {
  let recipients: string[] = [];
  if (step.targetUserId) {
    const recipient = await tx.user.findFirst({ where: { id: step.targetUserId, status: "ACTIVE" }, select: { id: true } });
    if (recipient) recipients = [recipient.id];
  } else if (step.targetRole) {
    recipients = (await tx.user.findMany({ where: { role: step.targetRole, status: "ACTIVE" }, select: { id: true } })).map((user) => user.id);
  }

  if (!recipients.length) {
    throw new AppError("Tahap workflow tidak memiliki penerima aktif", 409, "WORKFLOW_TARGET_UNAVAILABLE");
  }

  await tx.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      submissionId,
      type: "ACTION_REQUIRED",
      message: `Pengajuan ${number} menunggu tindakan Anda`,
    })),
  });
}

function actorCanAccess(user: SessionUser, submission: { requesterId: string; workflowSteps: Array<{ targetType: string; targetRole: Role | null; targetUserId: string | null }> }) {
  if (user.role === "SUPERADMIN" || user.role === "GENERAL_AFFAIRS" || submission.requesterId === user.id) return true;
  return submission.workflowSteps.some((step) =>
    step.targetUserId === user.id || (step.targetType === "ROLE" && step.targetRole === user.role),
  );
}

async function loadAccessibleSubmission(user: SessionUser, id: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { ...submissionInclude, workflowSteps: { select: { targetType: true, targetRole: true, targetUserId: true } } },
  });

  if (!submission || !actorCanAccess(user, submission)) throw notFound();
  return submission;
}

export async function createDraft(user: SessionUser, input: {
  categoryId: string;
  purpose: string;
  items: Array<{ name: string; quantity: number; description: string }>;
}) {
  if (user.role !== "REQUESTER" || !user.unitId) throw forbidden();

  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!category) throw notFound();

  const number = `OA-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(6).toString("hex").toUpperCase()}`;
  const submission = await prisma.submission.create({
    data: {
      number,
      requesterId: user.id,
      unitId: user.unitId,
      categoryId: input.categoryId,
      purpose: input.purpose,
      items: { create: itemData(input.items) },
    },
    select: { id: true, number: true, status: true, createdAt: true },
  });

  return submission;
}

export async function submitDraft(user: SessionUser, id: string) {
  const current = await prisma.submission.findUnique({
    where: { id },
    include: { category: { include: { workflow: { include: { steps: { orderBy: { order: "asc" } } } } } }, unit: true, items: true },
  });

  if (!current) throw notFound();
  if (current.requesterId !== user.id) throw forbidden();
  if (current.status !== "DRAFT") throw conflict("Hanya draft yang dapat dikirim");
  if (current.items.length === 0) throw conflict("Pengajuan harus memiliki minimal satu barang");

  const steps = current.category.workflow?.steps ?? [];
  if (current.category.status !== "ACTIVE" || current.category.workflow?.status !== "ACTIVE" || steps.length < 2) {
    throw conflict("Workflow aktif belum dikonfigurasi untuk kategori ini");
  }
  if (steps[0].targetType !== "UNIT_MANAGER" || steps[0].type !== "APPROVAL") {
    throw conflict("Tahap pertama workflow harus berupa approval Manager Unit");
  }
  if (steps.at(-1)?.type !== "APPROVAL") {
    throw conflict("Tahap terakhir workflow harus berupa approval");
  }
  if (!current.unit.managerId) throw conflict("Unit pemohon belum memiliki Manager Unit");

  const initialRows = steps.map((step) => {
    let targetUserId = step.targetUserId;
    if (step.targetType === "UNIT_MANAGER") targetUserId = current.unit.managerId;
    if (step.targetType === "ROLE" && !step.targetRole) throw conflict("Target role workflow belum diatur");
    if (step.targetType === "USER" && !targetUserId) throw conflict("Target pengguna workflow belum diatur");
    return {
      workflowStepId: step.id,
      order: step.order,
      type: step.type,
      targetType: step.targetType,
      targetRole: step.targetType === "UNIT_MANAGER" ? "UNIT_MANAGER" as const : step.targetRole,
      targetUserId: targetUserId ?? null,
      required: step.required,
      allowRevision: step.allowRevision,
    };
  });

  const first = initialRows[0];
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.submission.updateMany({
      where: { id, requesterId: user.id, status: "DRAFT" },
      data: { status: "WAITING_UNIT_MANAGER", submittedAt: new Date() },
    });
    if (updated.count !== 1) throw conflict("Pengajuan sudah berubah oleh proses lain");

    await tx.submissionStep.createMany({ data: initialRows.map((row) => ({ ...row, submissionId: id })) });
    const currentStep = await tx.submissionStep.findUniqueOrThrow({ where: { submissionId_order: { submissionId: id, order: first.order } } });
    await tx.submission.update({ where: { id }, data: { currentStepId: currentStep.id } });
    await tx.approvalAction.create({
      data: { submissionId: id, actorId: user.id, submissionStepId: currentStep.id, action: "SUBMITTED", resultingStatus: "WAITING_UNIT_MANAGER" },
    });
    await notifyStep(tx, id, current.number, first);

    return tx.submission.findUniqueOrThrow({ where: { id }, select: { id: true, number: true, status: true, submittedAt: true } });
  });

  return result;
}

export async function listSubmissions(user: SessionUser, filters: {
  q?: string;
  status?: SubmissionStatus;
  page: number;
  pageSize: number;
}) {
  const accessFilter: Prisma.SubmissionWhereInput = user.role === "SUPERADMIN" || user.role === "GENERAL_AFFAIRS"
    ? {}
    : user.role === "REQUESTER"
      ? { requesterId: user.id }
      : { workflowSteps: { some: { OR: [{ targetUserId: user.id }, { targetType: "ROLE", targetRole: user.role }] } } };

  const searchFilter: Prisma.SubmissionWhereInput = filters.q
    ? { OR: [
        { number: { contains: filters.q, mode: "insensitive" } },
        { purpose: { contains: filters.q, mode: "insensitive" } },
        { requester: { name: { contains: filters.q, mode: "insensitive" } } },
        { unit: { name: { contains: filters.q, mode: "insensitive" } } },
        { category: { name: { contains: filters.q, mode: "insensitive" } } },
      ] }
    : {};

  const where: Prisma.SubmissionWhereInput = {
    AND: [accessFilter, searchFilter, filters.status ? { status: filters.status } : {}],
  };
  const [total, data] = await prisma.$transaction([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        currentStep: { select: { type: true, targetRole: true, targetUser: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return { data, pagination: { page: filters.page, pageSize: filters.pageSize, total, pageCount: Math.ceil(total / filters.pageSize) } };
}

export async function getSubmission(user: SessionUser, id: string) {
  return loadAccessibleSubmission(user, id);
}

export async function updateSubmission(user: SessionUser, id: string, input: {
  purpose: string;
  items: Array<{ name: string; quantity: number; description: string }>;
}) {
  const submission = await prisma.submission.findUnique({ where: { id }, include: { items: true } });
  if (!submission) throw notFound();
  if (submission.requesterId !== user.id) throw forbidden();
  if (submission.status !== "DRAFT" && submission.status !== "NEEDS_REVISION") {
    throw conflict("Pengajuan hanya dapat diubah sebagai draft atau saat diminta revisi");
  }

  const snapshot = { purpose: submission.purpose, items: submission.items.map(({ name, quantity, description }) => ({ name, quantity, description })) };

  await prisma.$transaction(async (tx) => {
    const changed = await tx.submission.updateMany({
      where: { id, requesterId: user.id, status: submission.status, updatedAt: submission.updatedAt },
      data: { purpose: input.purpose, updatedAt: new Date() },
    });
    if (changed.count !== 1) throw conflict("Pengajuan berubah saat sedang diedit. Muat ulang sebelum mencoba lagi");

    if (submission.status === "NEEDS_REVISION") {
      const latest = await tx.submissionRevision.aggregate({ where: { submissionId: id }, _max: { version: true } });
      await tx.submissionRevision.create({
        data: { submissionId: id, version: (latest._max.version ?? 0) + 1, snapshot, editedById: user.id },
      });
    }

    await tx.submissionItem.deleteMany({ where: { submissionId: id } });
    await tx.submissionItem.createMany({
      data: itemData(input.items).map((item) => ({ ...item, submissionId: id })),
    });
    await tx.approvalAction.create({
      data: {
        submissionId: id,
        actorId: user.id,
        action: "EDITED",
        resultingStatus: submission.status,
        snapshot,
      },
    });
  });

  return { id, updated: true };
}

export async function resubmitRevision(user: SessionUser, id: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { currentStep: true, requester: { select: { name: true } } },
  });
  if (!submission) throw notFound();
  if (submission.requesterId !== user.id) throw forbidden();
  if (submission.status !== "NEEDS_REVISION" || !submission.currentStep) throw conflict("Pengajuan tidak sedang menunggu revisi");

  const currentStep = submission.currentStep;
  const newStatus = statusForStep(currentStep);
  await prisma.$transaction(async (tx) => {
    const updated = await tx.submission.updateMany({
      where: { id, requesterId: user.id, status: "NEEDS_REVISION", currentStepId: currentStep.id },
      data: { status: newStatus },
    });
    if (updated.count !== 1) throw conflict("Pengajuan sudah berubah oleh proses lain");

    await tx.approvalAction.create({
      data: { submissionId: id, actorId: user.id, submissionStepId: currentStep.id, action: "RESUBMITTED", resultingStatus: newStatus },
    });
    await notifyStep(tx, id, submission.number, currentStep);
  });

  return { id, status: newStatus };
}

export async function actOnSubmission(user: SessionUser, id: string, action: "APPROVE" | "REJECT" | "REQUEST_REVISION" | "CONSIDERATION" | "SKIP", note?: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { currentStep: true },
  });
  if (!submission || !submission.currentStep) throw notFound();
  const step = submission.currentStep;

  if (step.status !== "PENDING" || submission.status !== statusForStep(step)) throw conflict("Pengajuan tidak sedang menunggu tindakan pada tahap ini");
  if (step.targetUserId !== user.id && !(step.targetType === "ROLE" && step.targetRole === user.role)) throw forbidden();
  if (action === "CONSIDERATION" && step.type !== "CONSIDERATION") throw conflict("Tahap ini membutuhkan approval");
  if (action === "SKIP" && step.required) throw conflict("Tahap ini wajib dijalankan");
  if (action !== "CONSIDERATION" && action !== "SKIP" && step.type !== "APPROVAL") throw conflict("Tahap ini membutuhkan pertimbangan");
  if (action === "SKIP" && step.type === "CONSIDERATION" && step.targetType === "UNIT_MANAGER") throw conflict("Manager Unit tidak dapat dilewati");
  if (action === "REQUEST_REVISION" && !step.allowRevision) throw conflict("Revisi tidak diizinkan pada tahap ini");
  if ((action === "REJECT" || action === "REQUEST_REVISION" || action === "CONSIDERATION") && !note) {
    throw new AppError("Catatan wajib diisi untuk tindakan ini", 400, "NOTE_REQUIRED");
  }

  const nextStep = action === "APPROVE" || action === "CONSIDERATION" || action === "SKIP"
    ? await prisma.submissionStep.findFirst({
        where: { submissionId: id, order: { gt: step.order } },
        orderBy: { order: "asc" },
      })
    : null;

  const nextStatus: SubmissionStatus = action === "REJECT"
    ? "REJECTED"
    : action === "REQUEST_REVISION"
      ? "NEEDS_REVISION"
      : nextStep
        ? statusForStep(nextStep)
        : "APPROVED";

  await prisma.$transaction(async (tx) => {
    const updated = await tx.submission.updateMany({
      where: { id, currentStepId: step.id, status: submission.status },
      data: {
        status: nextStatus,
        currentStepId: action === "REQUEST_REVISION" ? step.id : nextStep?.id ?? null,
        approvedAt: nextStatus === "APPROVED" ? new Date() : undefined,
        decidedAt: nextStatus === "APPROVED" || nextStatus === "REJECTED" ? new Date() : undefined,
      },
    });
    if (updated.count !== 1) throw conflict("Pengajuan sudah diproses oleh pengguna lain");

    if (action !== "REQUEST_REVISION") {
      await tx.submissionStep.update({ where: { id: step.id }, data: { status: "COMPLETED" } });
    }

    await tx.approvalAction.create({
      data: {
        submissionId: id,
        submissionStepId: step.id,
        actorId: user.id,
        action: action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : action === "REQUEST_REVISION" ? "REVISION_REQUESTED" : action === "CONSIDERATION" ? "CONSIDERATION_GIVEN" : "SKIPPED",
        note,
        resultingStatus: nextStatus,
      },
    });

    if (nextStep) {
      await tx.submissionStep.update({ where: { id: nextStep.id }, data: { status: "PENDING" } });
      await notifyStep(tx, id, submission.number, nextStep);
    }

    if (nextStatus === "NEEDS_REVISION" || nextStatus === "REJECTED" || nextStatus === "APPROVED") {
      await tx.notification.create({
        data: {
          userId: submission.requesterId,
          submissionId: id,
          type: "STATUS_CHANGED",
          message: `Status pengajuan ${submission.number}: ${nextStatus}`,
        },
      });
    }
  });

  return { id, status: nextStatus, currentStepId: action === "REQUEST_REVISION" ? step.id : nextStep?.id ?? null };
}
