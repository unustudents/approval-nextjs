"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ZodError, z } from "zod";
import { AppError, conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { destroySession, requireSession } from "@/lib/session";

const updateProfileSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(50).regex(/^[a-z0-9._-]+$/),
  name: z.string().trim().min(2).max(160),
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(4).max(128).optional(),
});

export type ProfileActionResult =
  | { ok: true; credentialsChanged: boolean }
  | { ok: false; message: string };

export async function updateOwnProfileAction(input: unknown): Promise<ProfileActionResult> {
  try {
    const session = await requireSession();
    const data = updateProfileSchema.parse(input);
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { username: true, passwordHash: true },
    });

    if (!user) throw notFound();
    if (!await compare(data.currentPassword, user.passwordHash)) {
      throw conflict("Password saat ini tidak sesuai");
    }

    const credentialsChanged = data.username !== user.username || Boolean(data.newPassword);
    const passwordHash = data.newPassword ? await hash(data.newPassword, 12) : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.id },
        data: { username: data.username, name: data.name, passwordHash },
      });
      if (credentialsChanged) await tx.session.deleteMany({ where: { userId: session.id } });
    });

    revalidatePath("/profile");
    if (credentialsChanged) await destroySession();
    return { ok: true, credentialsChanged };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ZodError) return { ok: false, message: "Input tidak valid" };
    if (error instanceof AppError) return { ok: false, message: error.message };
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, message: "Username tersebut sudah digunakan" };
    }

    console.error("Profile update failed", error);
    return { ok: false, message: "Terjadi kesalahan internal" };
  }
}
