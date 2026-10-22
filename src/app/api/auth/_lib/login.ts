import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const attemptWindowMs = 15 * 60 * 1000;
const maxFailedAttempts = 5;
let dummyPasswordHash: Promise<string> | undefined;

function hashIdentifier(identifier: string) {
  return createHash("sha256").update(identifier).digest("hex");
}

export async function login(username: string, password: string, networkIdentifier: string) {
  const normalizedUsername = username.toLowerCase();
  const keyHash = hashIdentifier(`${normalizedUsername}\u0000${networkIdentifier}`);
  const now = new Date();
  const since = new Date(now.getTime() - attemptWindowMs);
  await prisma.authAttempt.deleteMany({ where: { windowStartedAt: { lt: since } } });
  const attempt = await prisma.authAttempt.findUnique({ where: { keyHash } });

  if (attempt && attempt.windowStartedAt >= since && attempt.failedAttempts >= maxFailedAttempts) {
    throw new AppError("Terlalu banyak percobaan login. Coba lagi nanti", 429, "RATE_LIMITED");
  }

  const user = await prisma.user.findUnique({ where: { username: normalizedUsername } });
  if (!user) dummyPasswordHash ??= hash(randomBytes(32).toString("hex"), 12);
  const passwordMatches = await compare(password, user?.passwordHash ?? await dummyPasswordHash!);

  if (!user || user.status !== "ACTIVE" || !passwordMatches) {
    const isCurrentWindow = attempt && attempt.windowStartedAt >= since;
    await prisma.authAttempt.upsert({
      where: { keyHash },
      create: { keyHash, failedAttempts: 1, windowStartedAt: now },
      update: isCurrentWindow
        ? { failedAttempts: { increment: 1 } }
        : { failedAttempts: 1, windowStartedAt: now },
    });
    throw new AppError("Username atau password salah", 401, "INVALID_CREDENTIALS");
  }

  await prisma.authAttempt.deleteMany({ where: { keyHash } });
  await createSession(user.id);

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    unitId: user.unitId,
  };
}
