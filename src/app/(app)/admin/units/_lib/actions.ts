"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ZodError, z } from "zod";
import { requireRole } from "@/lib/authorization";
import { AppError } from "@/lib/errors";
import type { UnitActionResult } from "./model";
import { createUnitSchema, updateUnitSchema } from "./schema";
import { createUnit, updateUnit } from "./service";

function actionError(error: unknown): UnitActionResult {
  unstable_rethrow(error);

  if (error instanceof ZodError) return { ok: false, message: "Input tidak valid" };
  if (error instanceof AppError) return { ok: false, message: error.message };
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    return { ok: false, message: "Data dengan nilai tersebut sudah ada" };
  }

  console.error("Admin unit action failed", error);
  return { ok: false, message: "Terjadi kesalahan internal" };
}

function revalidateUnits() {
  revalidatePath("/admin/units");
  revalidatePath("/admin/users");
}

export async function createUnitAction(input: unknown): Promise<UnitActionResult> {
  try {
    await requireRole("SUPERADMIN");
    await createUnit(createUnitSchema.parse(input));
    revalidateUnits();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateUnitAction(unitId: string, input: unknown): Promise<UnitActionResult> {
  try {
    await requireRole("SUPERADMIN");
    await updateUnit(z.uuid().parse(unitId), updateUnitSchema.parse(input));
    revalidateUnits();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}
