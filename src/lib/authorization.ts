import "server-only";
import { forbidden } from "@/lib/errors";
import type { Role } from "@/generated/prisma/client";
import { requireSession } from "@/lib/session";

export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  if (!session.roles.some((role) => roles.includes(role))) throw forbidden();
  return session;
}

export function isAdminRole(role: Role) {
  return role === "SUPERADMIN";
}
