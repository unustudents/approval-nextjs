import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma, Role, SubmissionStatus, SubmissionStep } from "@/generated/prisma/client";
import { AppError, conflict, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import { removeAttachmentFiles } from "./attachment-storage";

const submissionInclude = {
  requester: { select: { id: true, username: true, name: true, roles: { select: { role: true } } } },
  unit: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  items: true,
  currentStep: { select: { id: true, order: true, targetType: true, targetRole: true, status: true, targetUser: { select: { id: true, name: true } } } },
  actions: {
    orderBy: { createdAt: "asc" as const },
    include: { actor: { select: { id: true, name: true, roles: { select: { role: true } } } }, submissionStep: { select: { order: true } } },
  },
  revisions: {
    orderBy: { createdAt: "asc" as const },
    include: { editedBy: { select: { id: true, name: true } } },
  },
  attachments: { select: { id: true, originalFilename: true, mimeType: true, sizeBytes: true, createdAt: true } },
  considerationRequests: {
    orderBy: { createdAt: "asc" as const },
    include: {
      requestedBy: { select: { id: true, name: true } },
      recipient: { select: { id: true, name: true, roles: { select: { role: true } } } },
    },
  },
  explanationRequests: {
    orderBy: { createdAt: "asc" as const },
    include: {
      requestedBy: { select: { id: true, name: true } },
      recipient: { select: { id: true, name: true } },
    },
  },
};

function hasRole(user: SessionUser, role: Role) {
  return user.roles.includes(role);
}

function statusForStep(step: Pick<SubmissionStep, "targetType" | "targetRole">): SubmissionStatus {
  if (step.targetType === "UNIT_MANAGER") return "WAITING_UNIT_MANAGER";
  return "WAITING_FINANCE";
}

function itemData(
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    description: string;
    specification: string;
  }>,
) {
  return items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    description: item.description,
    specification: item.specification,
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
    recipients = (await tx.user.findMany({ where: { roles: { some: { role: step.targetRole } }, status: "ACTIVE" }, select: { id: true } })).map((user) => user.id);
  }

  if (!recipients.length) {
    throw new AppError("Tahap approval tidak memiliki penerima aktif", 409, "APPROVAL_TARGET_UNAVAILABLE");
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

function actorCanAccess(user: SessionUser, submission: { requesterId: string; approvalSteps: Array<{ targetType: string; targetRole: Role | null; targetUserId: string | null }>; considerationRequests: Array<{ recipientId: string }>; explanationRequests: Array<{ recipientId: string }> }) {
  if (hasRole(user, "SUPERADMIN") || hasRole(user, "GENERAL_AFFAIRS") || submission.requesterId === user.id) return true;
  return submission.approvalSteps.some((step) =>
    step.targetUserId === user.id || (step.targetType === "ROLE" && step.targetRole !== null && hasRole(user, step.targetRole)),
  ) || submission.considerationRequests.some((request) => request.recipientId === user.id) || submission.explanationRequests.some((request) => request.recipientId === user.id);
}

async function loadAccessibleSubmission(user: SessionUser, id: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { ...submissionInclude, approvalSteps: { select: { targetType: true, targetRole: true, targetUserId: true } } },
  });

  if (!submission || !actorCanAccess(user, submission)) throw notFound();
  return submission;
}

export async function createDraft(user: SessionUser, input: {
  categoryId: string;
  unitId?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    description: string;
    specification: string;
  }>;
}) {
  let requestingUnitId: string;
  if (hasRole(user, "UNIT_MANAGER")) {
    if (!input.unitId) throw conflict("Pilih unit kerja yang akan mengajukan pengadaan");
    const managedUnit = await prisma.unit.findFirst({
      where: { id: input.unitId, managerId: user.id, status: "ACTIVE" },
      select: { id: true },
    });
    if (!managedUnit) throw forbidden();
    requestingUnitId = managedUnit.id;
  } else {
    if (!hasRole(user, "REQUESTER") || !user.unitId) throw forbidden();
    requestingUnitId = user.unitId;
  }

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
      unitId: requestingUnitId,
      categoryId: input.categoryId,
      items: { create: itemData(input.items) },
    },
    select: { id: true, number: true, status: true, createdAt: true },
  });

  return submission;
}

export async function listManagedUnits(user: SessionUser) {
  if (!hasRole(user, "UNIT_MANAGER")) throw forbidden();
  return prisma.unit.findMany({
    where: { managerId: user.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function submitDraft(user: SessionUser, id: string) {
  const current = await prisma.submission.findUnique({
    where: { id },
    include: { category: true, unit: true, items: true },
  });

  if (!current) throw notFound();
  if (current.requesterId !== user.id) throw forbidden();
  if (current.status !== "DRAFT") throw conflict("Hanya draft yang dapat dikirim");
  if (current.items.length === 0) throw conflict("Pengajuan harus memiliki minimal satu barang");

  if (current.category.status !== "ACTIVE") throw conflict("Kategori pengajuan tidak aktif");
  const managerIsRequester = hasRole(user, "UNIT_MANAGER");
  if (!managerIsRequester && !current.unit.managerId) throw conflict("Unit pemohon belum memiliki Manager Unit");
  const financeApproverCount = await prisma.user.count({
    where: { status: "ACTIVE", roles: { some: { role: "FINANCE_APPROVER" } } },
  });
  if (financeApproverCount === 0) throw conflict("Belum ada approver keuangan aktif");

  const initialRows: Array<{
    order: number;
    targetType: "UNIT_MANAGER" | "ROLE";
    targetRole: Role | null;
    targetUserId: string | null;
  }> = [];
  if (!managerIsRequester) {
    initialRows.push({
      order: 1,
      targetType: "UNIT_MANAGER",
      targetRole: "UNIT_MANAGER",
      targetUserId: current.unit.managerId,
    });
  }
  initialRows.push({
    order: initialRows.length + 1,
    targetType: "ROLE",
    targetRole: "FINANCE_APPROVER",
    targetUserId: null,
  });

  const first = initialRows[0];
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.submission.updateMany({
      where: { id, requesterId: user.id, status: "DRAFT" },
      data: { status: statusForStep(first), submittedAt: new Date() },
    });
    if (updated.count !== 1) throw conflict("Pengajuan sudah berubah oleh proses lain");

    await tx.submissionStep.createMany({ data: initialRows.map((row) => ({ ...row, submissionId: id })) });
    const currentStep = await tx.submissionStep.findUniqueOrThrow({ where: { submissionId_order: { submissionId: id, order: first.order } } });
    await tx.submission.update({ where: { id }, data: { currentStepId: currentStep.id } });
    await tx.approvalAction.create({
      data: { submissionId: id, actorId: user.id, submissionStepId: currentStep.id, action: "SUBMITTED", resultingStatus: statusForStep(first) },
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
  const accessFilter: Prisma.SubmissionWhereInput = hasRole(user, "SUPERADMIN") || hasRole(user, "GENERAL_AFFAIRS")
    ? {}
    : { OR: [{ requesterId: user.id }, { approvalSteps: { some: { OR: [{ targetUserId: user.id }, { targetType: "ROLE", targetRole: { in: user.roles } }] } } }] };

  const searchFilter: Prisma.SubmissionWhereInput = filters.q
    ? { OR: [
        { number: { contains: filters.q } },
        { requester: { name: { contains: filters.q } } },
        { unit: { name: { contains: filters.q } } },
        { category: { name: { contains: filters.q } } },
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
        currentStep: { select: { targetRole: true, targetUser: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return { data, pagination: { page: filters.page, pageSize: filters.pageSize, total, pageCount: Math.ceil(total / filters.pageSize) } };
}

export async function getSubmission(user: SessionUser, id: string) {
  const submission = await loadAccessibleSubmission(user, id);
  const isRequester = submission.requesterId === user.id;
  const canEdit = isRequester && submission.status === "NEEDS_REVISION";
  const canDelete =
    isRequester &&
    submission.status === "WAITING_UNIT_MANAGER" &&
    submission.currentStep?.targetType === "UNIT_MANAGER" &&
    submission.currentStep.status === "PENDING" &&
    !submission.actions.some((action) => action.actor.id !== user.id);

  return { ...submission, permissions: { canEdit, canDelete } };
}

export async function deleteUnansweredSubmission(user: SessionUser, id: string) {
  const storageKeys = await prisma.$transaction(
    async (tx) => {
      const submission = await tx.submission.findUnique({
        where: { id },
        include: {
          currentStep: true,
          actions: { select: { actorId: true } },
          attachments: { select: { storageKey: true } },
        },
      });

      if (!submission) throw notFound();
      if (submission.requesterId !== user.id) throw forbidden();
      if (
        submission.status !== "WAITING_UNIT_MANAGER" ||
        submission.currentStep?.targetType !== "UNIT_MANAGER" ||
        submission.currentStep.status !== "PENDING" ||
        submission.actions.some((action) => action.actorId !== user.id)
      ) {
        throw conflict(
          "Pengajuan hanya dapat dihapus sebelum Manager Unit memberikan tanggapan",
        );
      }

      const locked = await tx.submission.updateMany({
        where: {
          id,
          requesterId: user.id,
          status: "WAITING_UNIT_MANAGER",
          currentStepId: submission.currentStepId,
        },
        data: { updatedAt: new Date() },
      });
      if (locked.count !== 1) {
        throw conflict("Pengajuan sudah berubah. Muat ulang sebelum mencoba lagi");
      }

      await tx.approvalAction.deleteMany({ where: { submissionId: id } });
      await tx.submission.delete({ where: { id } });

      return submission.attachments.map((attachment) => attachment.storageKey);
    },
    { isolationLevel: "Serializable" },
  );

  await removeAttachmentFiles(storageKeys);
  return { id, deleted: true };
}

export async function updateSubmission(user: SessionUser, id: string, input: {
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    description: string;
    specification: string;
  }>;
}) {
  const submission = await prisma.submission.findUnique({ where: { id }, include: { items: true } });
  if (!submission) throw notFound();
  if (submission.requesterId !== user.id) throw forbidden();
  if (submission.status !== "DRAFT" && submission.status !== "NEEDS_REVISION") {
    throw conflict("Pengajuan hanya dapat diubah sebagai draft atau saat diminta revisi");
  }

  const snapshot = {
    items: submission.items.map(
      ({ name, quantity, unitPrice, description, specification }) => ({
        name,
        quantity,
        unitPrice,
        description,
        specification,
      }),
    ),
  };

  await prisma.$transaction(async (tx) => {
    const changed = await tx.submission.updateMany({
      where: { id, requesterId: user.id, status: submission.status, updatedAt: submission.updatedAt },
      data: { updatedAt: new Date() },
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

export async function actOnSubmission(user: SessionUser, id: string, action: "APPROVE" | "REJECT" | "REQUEST_REVISION", note?: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { currentStep: true },
  });
  if (!submission || !submission.currentStep) throw notFound();
  const step = submission.currentStep;

  if (step.status !== "PENDING" || submission.status !== statusForStep(step)) throw conflict("Pengajuan tidak sedang menunggu tindakan pada tahap ini");
  if (step.targetUserId !== user.id && !(step.targetType === "ROLE" && step.targetRole !== null && hasRole(user, step.targetRole))) throw forbidden();
  if ((action === "REJECT" || action === "REQUEST_REVISION") && !note) {
    throw new AppError("Catatan wajib diisi untuk tindakan ini", 400, "NOTE_REQUIRED");
  }

  const nextStep = action === "APPROVE"
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
        action: action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "REVISION_REQUESTED",
        actorRole: step.targetType === "UNIT_MANAGER" ? "UNIT_MANAGER" : step.targetRole && hasRole(user, step.targetRole) ? step.targetRole : user.roles[0],
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

function canActOnCurrentStep(user: SessionUser, currentStep: { targetType: string; targetRole: Role | null; targetUserId: string | null }) {
  return hasRole(user, "SUPERADMIN") || currentStep.targetUserId === user.id || (currentStep.targetType === "ROLE" && currentStep.targetRole !== null && hasRole(user, currentStep.targetRole));
}

export async function listConsiderationCandidates(user: SessionUser, submissionId: string) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { currentStep: true } });
  if (!submission || !submission.currentStep || !canActOnCurrentStep(user, submission.currentStep)) throw forbidden();
  return prisma.user.findMany({
    where: { id: { not: user.id }, status: "ACTIVE", roles: { some: { role: "CONSIDERATION" } } },
    select: { id: true, name: true, username: true, unit: { select: { id: true, name: true } }, roles: { select: { role: true }, orderBy: { role: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function requestConsideration(user: SessionUser, submissionId: string, recipientId: string, message: string) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { currentStep: true } });
  if (!submission || !submission.currentStep || !canActOnCurrentStep(user, submission.currentStep)) throw forbidden();
  const currentStep = submission.currentStep;
  if (!["WAITING_UNIT_MANAGER", "WAITING_FINANCE"].includes(submission.status)) {
    throw conflict("Pertimbangan hanya dapat diminta saat pengajuan masih diproses");
  }
  const recipient = await prisma.user.findFirst({ where: { id: recipientId, status: "ACTIVE", roles: { some: { role: "CONSIDERATION" } } }, select: { id: true, name: true } });
  if (!recipient) throw conflict("Penerima harus merupakan akun aktif dengan role Pemberi Pertimbangan");
  if (recipient.id === user.id) throw conflict("Anda tidak dapat meminta pertimbangan kepada akun sendiri");
  return prisma.$transaction(async (tx) => {
    const request = await tx.considerationRequest.create({
      data: { submissionId, requestedById: user.id, recipientId, message },
      include: { recipient: { select: { id: true, name: true } } },
    });
    await tx.notification.create({ data: { userId: recipientId, submissionId, type: "ACTION_REQUIRED", message: `${user.name} meminta pertimbangan Anda untuk pengajuan ${submission.number}` } });
    await tx.approvalAction.create({
      data: { submissionId, submissionStepId: currentStep.id, actorId: user.id, actorRole: currentStep.targetType === "UNIT_MANAGER" ? "UNIT_MANAGER" : currentStep.targetRole && hasRole(user, currentStep.targetRole) ? currentStep.targetRole : user.roles[0], action: "CONSIDERATION_REQUESTED", note: message, resultingStatus: submission.status, snapshot: { considerationRequestId: request.id, recipientId, recipientName: recipient.name } },
    });
    return request;
  });
}

export async function respondToConsideration(user: SessionUser, submissionId: string, requestId: string, response: string) {
  const request = await prisma.considerationRequest.findFirst({ where: { id: requestId, submissionId }, include: { submission: { select: { number: true, status: true } } } });
  if (!request) throw notFound();
  if (request.recipientId !== user.id || !hasRole(user, "CONSIDERATION")) throw forbidden();
  if (request.status !== "PENDING") throw conflict("Permintaan pertimbangan ini sudah ditanggapi");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.considerationRequest.update({ where: { id: requestId }, data: { response, status: "RESPONDED", respondedAt: new Date() } });
    await tx.approvalAction.create({
      data: { submissionId, actorId: user.id, actorRole: "CONSIDERATION", action: "CONSIDERATION_GIVEN", note: response, resultingStatus: request.submission.status, snapshot: { considerationRequestId: requestId, requestedById: request.requestedById } },
    });
    await tx.notification.create({ data: { userId: request.requestedById, submissionId, type: "STATUS_CHANGED", message: `${user.name} telah memberikan pertimbangan untuk pengajuan ${request.submission.number}` } });
    return updated;
  });
}

export async function requestExplanation(user: SessionUser, submissionId: string, question: string) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { currentStep: true, requester: { select: { id: true, name: true } } } });
  if (!submission || !submission.currentStep || !canActOnCurrentStep(user, submission.currentStep)) throw forbidden();
  if (!["WAITING_UNIT_MANAGER", "WAITING_FINANCE"].includes(submission.status)) throw conflict("Penjelasan hanya dapat diminta saat pengajuan masih diproses");
  const currentStep = submission.currentStep;
  return prisma.$transaction(async (tx) => {
    const request = await tx.explanationRequest.create({ data: { submissionId, requestedById: user.id, recipientId: submission.requesterId, question } });
    await tx.notification.create({ data: { userId: submission.requesterId, submissionId, type: "ACTION_REQUIRED", message: `${user.name} meminta penjelasan untuk pengajuan ${submission.number}` } });
    await tx.approvalAction.create({
      data: { submissionId, submissionStepId: currentStep.id, actorId: user.id, actorRole: currentStep.targetType === "UNIT_MANAGER" ? "UNIT_MANAGER" : currentStep.targetRole && hasRole(user, currentStep.targetRole) ? currentStep.targetRole : user.roles[0], action: "EXPLANATION_REQUESTED", note: question, resultingStatus: submission.status, snapshot: { explanationRequestId: request.id, recipientId: submission.requester.id, recipientName: submission.requester.name } },
    });
    return request;
  });
}

export async function answerExplanation(user: SessionUser, submissionId: string, requestId: string, answer: string) {
  const request = await prisma.explanationRequest.findFirst({ where: { id: requestId, submissionId }, include: { submission: { select: { number: true, status: true } } } });
  if (!request) throw notFound();
  if (request.recipientId !== user.id) throw forbidden();
  if (request.status !== "PENDING") throw conflict("Permintaan penjelasan ini sudah dijawab");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.explanationRequest.update({ where: { id: requestId }, data: { answer, status: "ANSWERED", answeredAt: new Date() } });
    await tx.approvalAction.create({ data: { submissionId, actorId: user.id, actorRole: hasRole(user, "REQUESTER") ? "REQUESTER" : user.roles[0], action: "EXPLANATION_GIVEN", note: answer, resultingStatus: request.submission.status, snapshot: { explanationRequestId: requestId, requestedById: request.requestedById } } });
    await tx.notification.create({ data: { userId: request.requestedById, submissionId, type: "STATUS_CHANGED", message: `${user.name} telah memberikan penjelasan untuk pengajuan ${request.submission.number}` } });
    return updated;
  });
}
