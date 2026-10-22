import "server-only";
import { conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

async function assertManager(managerId: string | null | undefined) {
  if (managerId === undefined || managerId === null) return;
  const manager = await prisma.user.findFirst({
    where: { id: managerId, role: "UNIT_MANAGER", status: "ACTIVE" },
    select: { id: true },
  });
  if (!manager) throw conflict("Manager harus berupa pengguna aktif dengan role Manager Unit");
}

export async function listUnits() {
  return prisma.unit.findMany({
    select: { id: true, name: true, status: true, manager: { select: { id: true, name: true } }, _count: { select: { members: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createUnit(input: { name: string; managerId?: string | null }) {
  await assertManager(input.managerId);
  return prisma.unit.create({
    data: { name: input.name, managerId: input.managerId ?? null },
    select: { id: true, name: true, status: true, manager: { select: { id: true, name: true } } },
  });
}

export async function updateUnit(id: string, input: {
  name?: string;
  managerId?: string | null;
  status?: "ACTIVE" | "INACTIVE";
}) {
  const unit = await prisma.unit.findUnique({ where: { id }, include: { _count: { select: { members: true } } } });
  if (!unit) throw notFound();
  if (input.status === "INACTIVE" && unit._count.members > 0) throw conflict("Pindahkan pengguna dari unit sebelum menonaktifkannya");
  await assertManager(input.managerId);

  return prisma.unit.update({
    where: { id },
    data: { name: input.name, managerId: input.managerId, status: input.status },
    select: { id: true, name: true, status: true, manager: { select: { id: true, name: true } } },
  });
}
