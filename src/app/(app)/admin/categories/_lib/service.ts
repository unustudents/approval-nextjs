import "server-only";
import { notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function listCategories() {
  return prisma.category.findMany({ select: { id: true, name: true, status: true }, orderBy: { name: "asc" } });
}

export async function createCategory(name: string) {
  return prisma.category.create({ data: { name }, select: { id: true, name: true, status: true } });
}

export async function updateCategory(id: string, input: { name?: string; status?: "ACTIVE" | "INACTIVE" }) {
  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!category) throw notFound();
  return prisma.category.update({ where: { id }, data: input, select: { id: true, name: true, status: true } });
}
