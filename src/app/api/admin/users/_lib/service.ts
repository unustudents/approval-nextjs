import "server-only";
import { hash } from "bcryptjs";
import { conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, status: true, unitId: true, createdAt: true, updatedAt: true },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    take: 500,
  });
}

export async function createUser(input: {
  username: string;
  name: string;
  password: string;
  role: "REQUESTER" | "UNIT_MANAGER" | "CONSIDERATION" | "FINANCE_APPROVER" | "GENERAL_AFFAIRS" | "SUPERADMIN";
  unitId?: string | null;
}) {
  if (input.role === "REQUESTER" && !input.unitId) throw conflict("Pemohon harus ditetapkan ke unit kerja");
  if (input.unitId) {
    const unit = await prisma.unit.findFirst({ where: { id: input.unitId, status: "ACTIVE" }, select: { id: true } });
    if (!unit) throw notFound();
  }

  const passwordHash = await hash(input.password, 12);
  return prisma.user.create({
    data: { username: input.username, name: input.name, passwordHash, role: input.role, unitId: input.unitId ?? null },
    select: { id: true, username: true, name: true, role: true, status: true, unitId: true, createdAt: true },
  });
}

export async function updateUser(actor: SessionUser, id: string, input: {
  username?: string;
  name?: string;
  password?: string;
  role?: "REQUESTER" | "UNIT_MANAGER" | "CONSIDERATION" | "FINANCE_APPROVER" | "GENERAL_AFFAIRS" | "SUPERADMIN";
  status?: "ACTIVE" | "INACTIVE";
  unitId?: string | null;
}) {
  const target = await prisma.user.findUnique({ where: { id }, include: { managedUnits: true } });
  if (!target) throw notFound();
  const resultingUnitId = input.unitId === undefined ? target.unitId : input.unitId;
  const resultingRole = input.role ?? target.role;
  if (resultingRole === "REQUESTER" && !resultingUnitId) throw conflict("Pemohon harus ditetapkan ke unit kerja");
  if (target.managedUnits.length > 0 && input.role && input.role !== "UNIT_MANAGER") {
    throw conflict("Pindahkan Manager Unit pada unitnya sebelum mengubah role");
  }
  if (input.role && input.role !== target.role) {
    const roleWorkflowAssignments = await prisma.workflowStep.count({
      where: { targetType: "ROLE", targetRole: target.role, workflow: { status: "ACTIVE", category: { status: "ACTIVE" } } },
    });
    if (roleWorkflowAssignments > 0) {
      const remainingRoleUsers = await prisma.user.count({ where: { role: target.role, status: "ACTIVE", id: { not: id } } });
      if (remainingRoleUsers === 0) throw conflict("Role ini masih dipakai workflow aktif dan harus memiliki pengguna aktif");
    }
  }
  if (input.status === "INACTIVE" && target.status === "ACTIVE") {
    if (target.managedUnits.some((unit) => unit.status === "ACTIVE")) {
      throw conflict("Tetapkan Manager Unit pengganti sebelum menonaktifkan akun ini");
    }
    const pendingAssignments = await prisma.submissionStep.count({
      where: { targetUserId: id, status: "PENDING", submission: { status: { in: ["WAITING_UNIT_MANAGER", "WAITING_CONSIDERATION", "WAITING_APPROVAL", "WAITING_FINANCE"] } } },
    });
    if (pendingAssignments > 0) throw conflict("Pengguna masih memiliki pengajuan yang menunggu tindakannya");

    const directWorkflowAssignments = await prisma.workflowStep.count({
      where: { targetType: "USER", targetUserId: id, workflow: { status: "ACTIVE", category: { status: "ACTIVE" } } },
    });
    if (directWorkflowAssignments > 0) throw conflict("Ubah workflow aktif sebelum menonaktifkan pengguna yang menjadi target");

    const roleWorkflowAssignments = await prisma.workflowStep.count({
      where: { targetType: "ROLE", targetRole: target.role, workflow: { status: "ACTIVE", category: { status: "ACTIVE" } } },
    });
    if (roleWorkflowAssignments > 0) {
      const activeRoleUsers = await prisma.user.count({ where: { role: target.role, status: "ACTIVE" } });
      if (activeRoleUsers <= 1) throw conflict("Role ini masih dipakai workflow aktif dan harus memiliki pengguna aktif");
    }
  }
  const removesSuperadmin = target.role === "SUPERADMIN" && (input.status === "INACTIVE" || (input.role !== undefined && input.role !== "SUPERADMIN"));
  if (removesSuperadmin) {
    const activeAdmins = await prisma.user.count({ where: { role: "SUPERADMIN", status: "ACTIVE" } });
    if (activeAdmins <= 1) throw conflict("Minimal harus ada satu Superadmin aktif");
  }
  if (id === actor.id && input.status === "INACTIVE") throw conflict("Akun yang sedang digunakan tidak dapat dinonaktifkan");
  if (id === actor.id && target.role === "SUPERADMIN" && input.role && input.role !== "SUPERADMIN") {
    throw conflict("Akun Superadmin yang sedang digunakan tidak dapat diturunkan role-nya");
  }
  if (resultingUnitId) {
    const unit = await prisma.unit.findFirst({ where: { id: resultingUnitId, status: "ACTIVE" }, select: { id: true } });
    if (!unit) throw notFound();
  }

  const passwordHash = input.password ? await hash(input.password, 12) : undefined;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: { username: input.username, name: input.name, passwordHash, role: input.role, status: input.status, unitId: input.unitId },
      select: { id: true, username: true, name: true, role: true, status: true, unitId: true, updatedAt: true },
    });
    if (input.username || passwordHash || input.role || input.status) {
      await tx.session.deleteMany({ where: { userId: id } });
    }
    return updated;
  });
}
