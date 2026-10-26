"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ZodError, z } from "zod";
import { requireRole } from "@/lib/authorization";
import { AppError } from "@/lib/errors";
import type { CategoryActionResult } from "./model";
import { createCategorySchema, updateCategorySchema } from "./schema";
import { createCategory, updateCategory } from "./service";

function actionError(error: unknown): CategoryActionResult {
  unstable_rethrow(error);
  if (error instanceof ZodError) return { ok: false, message: "Input tidak valid" };
  if (error instanceof AppError) return { ok: false, message: error.message };
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") return { ok: false, message: "Data dengan nilai tersebut sudah ada" };
  console.error("Admin category action failed", error);
  return { ok: false, message: "Terjadi kesalahan internal" };
}

function revalidateCategories() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/workflows");
  revalidatePath("/submissions/new");
}

export async function createCategoryAction(input: unknown): Promise<CategoryActionResult> {
  try { await requireRole("SUPERADMIN"); await createCategory(createCategorySchema.parse(input).name); revalidateCategories(); return { ok: true }; } catch (error) { return actionError(error); }
}

export async function updateCategoryAction(categoryId: string, input: unknown): Promise<CategoryActionResult> {
  try { await requireRole("SUPERADMIN"); await updateCategory(z.uuid().parse(categoryId), updateCategorySchema.parse(input)); revalidateCategories(); return { ok: true }; } catch (error) { return actionError(error); }
}
