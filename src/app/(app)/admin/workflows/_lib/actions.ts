"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ZodError, z } from "zod";
import { requireRole } from "@/lib/authorization";
import { AppError } from "@/lib/errors";
import type { WorkflowActionResult } from "./model";
import { workflowInputSchema } from "./schema";
import { replaceWorkflow } from "./service";

function actionError(error: unknown): WorkflowActionResult {
  unstable_rethrow(error);
  if (error instanceof ZodError) return { ok: false, message: "Input tidak valid" };
  if (error instanceof AppError) return { ok: false, message: error.message };
  console.error("Admin workflow action failed", error);
  return { ok: false, message: "Terjadi kesalahan internal" };
}

export async function replaceWorkflowAction(categoryId: string, input: unknown): Promise<WorkflowActionResult> {
  try {
    await requireRole("SUPERADMIN");
    await replaceWorkflow(z.uuid().parse(categoryId), workflowInputSchema.parse(input));
    revalidatePath("/admin/workflows");
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}
