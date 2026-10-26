"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ZodError, z } from "zod";
import { requireRole } from "@/lib/authorization";
import { AppError } from "@/lib/errors";
import type { UserActionResult } from "./model";
import { createUserSchema, updateUserSchema } from "./schema";
import { createUser, updateUser } from "./service";

function actionError(error: unknown): UserActionResult {
  unstable_rethrow(error);

  if (error instanceof ZodError) return { ok: false, message: "Input tidak valid" };
  if (error instanceof AppError) return { ok: false, message: error.message };
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    return { ok: false, message: "Data dengan nilai tersebut sudah ada" };
  }

  console.error("Admin user action failed", error);
  return { ok: false, message: "Terjadi kesalahan internal" };
}

function revalidateUsers() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/units");
}

export async function createUserAction(input: unknown): Promise<UserActionResult> {
  try {
    await requireRole("SUPERADMIN");
    await createUser(createUserSchema.parse(input));
    revalidateUsers();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateUserAction(userId: string, input: unknown): Promise<UserActionResult> {
  try {
    const actor = await requireRole("SUPERADMIN");
    await updateUser(actor, z.uuid().parse(userId), updateUserSchema.parse(input));
    revalidateUsers();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}
