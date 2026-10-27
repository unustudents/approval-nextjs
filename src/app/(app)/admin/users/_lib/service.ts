import "server-only";
import { hash } from "bcryptjs";
import type { Role } from "@/generated/prisma/client";
import { conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";

export type UserRoleInput = Role[];

const activeUserWithRole = (role: Role, excludedId?: string) => ({
  status: "ACTIVE" as const,
  ...(excludedId ? { id: { not: excludedId } } : {}),
  roles: { some: { role } },
});

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true, username: true, name: true,
      roles: { select: { role: true }, orderBy: { role: "asc" } },
      status: true, unit: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    take: 500,
  });
}

export async function createUser(input: { username: string; name: string; password: string; roles: UserRoleInput; unitId?: string | null }) {
  if (input.roles.includes("REQUESTER") && !input.unitId) throw conflict("Akun dengan role Kepala Unit / SPV harus ditetapkan ke unit kerja");
  if (input.unitId) {
    const unit = await prisma.unit.findFirst({ where: { id: input.unitId, status: "ACTIVE" }, select: { id: true } });
    if (!unit) throw notFound();
  }
  const passwordHash = await hash(input.password, 12);
  return prisma.user.create({
    data: { username: input.username, name: input.name, passwordHash, roles: { create: input.roles.map((role) => ({ role })) }, unitId: input.unitId ?? null },
    select: { id: true },
  });
}

export async function updateUser(actor: SessionUser, id: string, input: { username?: string; name?: string; password?: string; roles?: UserRoleInput; status?: "ACTIVE" | "INACTIVE"; unitId?: string | null }) {
  const target = await prisma.user.findUnique({ where: { id }, include: { managedUnits: true, roles: { select: { role: true } } } });
  if (!target) throw notFound();
  const currentRoles = target.roles.map((assignment) => assignment.role);
  const resultingRoles = input.roles ?? currentRoles;
  const resultingUnitId = input.unitId === undefined ? target.unitId : input.unitId;
  if (resultingRoles.includes("REQUESTER") && !resultingUnitId) throw conflict("Akun dengan role Kepala Unit / SPV harus ditetapkan ke unit kerja");
  if (target.managedUnits.length > 0 && !resultingRoles.includes("UNIT_MANAGER")) throw conflict("Pindahkan Manager Unit pada unitnya sebelum menghapus role Manager Unit");
  if (input.status === "INACTIVE" && target.status === "ACTIVE") {
    if (target.managedUnits.some((unit) => unit.status === "ACTIVE")) throw conflict("Tetapkan Manager Unit pengganti sebelum menonaktifkan akun ini");
    const [pendingAssignments, pendingRequests] = await Promise.all([
      prisma.submissionStep.count({ where: { targetUserId: id, status: "PENDING", submission: { status: { in: ["WAITING_UNIT_MANAGER", "WAITING_FINANCE"] } } } }),
      prisma.considerationRequest.count({ where: { recipientId: id, status: "PENDING" } }),
    ]);
    if (pendingAssignments || pendingRequests) throw conflict("Pengguna masih memiliki tugas atau permintaan pertimbangan yang menunggu tindakan");
  }
  if (id === actor.id && input.status === "INACTIVE") throw conflict("Akun yang sedang digunakan tidak dapat dinonaktifkan");
  if (id === actor.id && actor.roles.includes("SUPERADMIN") && !resultingRoles.includes("SUPERADMIN")) throw conflict("Akun Superadmin yang sedang digunakan tidak dapat dihapus role Superadmin-nya");
  if (currentRoles.includes("SUPERADMIN") && !resultingRoles.includes("SUPERADMIN")) {
    const activeAdmins = await prisma.user.count({ where: activeUserWithRole("SUPERADMIN", id) });
    if (activeAdmins === 0) throw conflict("Minimal harus ada satu Superadmin aktif");
  }
  if (resultingUnitId) {
    const unit = await prisma.unit.findFirst({ where: { id: resultingUnitId, status: "ACTIVE" }, select: { id: true } });
    if (!unit) throw notFound();
  }
  const passwordHash = input.password ? await hash(input.password, 12) : undefined;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: { username: input.username, name: input.name, passwordHash, status: input.status, unitId: input.unitId, ...(input.roles ? { roles: { deleteMany: {}, create: input.roles.map((role) => ({ role })) } } : {}) },
      select: { id: true },
    });
    if (input.username || passwordHash || input.roles || input.status) await tx.session.deleteMany({ where: { userId: id } });
    return updated;
  });
}
