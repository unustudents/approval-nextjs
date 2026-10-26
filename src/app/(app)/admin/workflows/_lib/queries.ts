import "server-only";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authorization";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { listWorkflows } from "./service";

export async function getWorkflowsPageData() {
  try {
    await requireRole("SUPERADMIN");
  } catch (error) {
    if (error instanceof AppError && error.status === 401) redirect("/login");
    throw error;
  }

  const [categories, users] = await Promise.all([
    listWorkflows(),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, username: true, roles: { select: { role: true }, orderBy: { role: "asc" } } },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);
  return { categories, users };
}
