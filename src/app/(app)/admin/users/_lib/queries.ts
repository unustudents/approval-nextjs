import "server-only";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authorization";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { listUsers } from "./service";

export async function getUsersPageData() {
  try {
    await requireRole("SUPERADMIN");
  } catch (error) {
    if (error instanceof AppError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }

  const [users, units] = await Promise.all([
    listUsers(),
    prisma.unit.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { users, units };
}
