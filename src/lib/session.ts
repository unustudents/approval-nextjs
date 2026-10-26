import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/client";
import { unauthorized } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const cookieName = "office_approval_session";
const sessionDurationMs = 1000 * 60 * 60 * 12;

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  roles: Role[];
  unitId: string | null;
};

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  await prisma.session.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  cookieStore.delete(cookieName);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { include: { roles: { select: { role: true } } } } },
  });

  if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    cookieStore.delete(cookieName);
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
    roles: session.user.roles.map((assignment) => assignment.role),
    unitId: session.user.unitId,
  } satisfies SessionUser;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw unauthorized();
  return session;
}
