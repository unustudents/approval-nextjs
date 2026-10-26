import "server-only";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authorization";
import { AppError } from "@/lib/errors";
import { listManagerCandidates, listUnits } from "./service";

export async function getUnitsPageData() {
  try {
    await requireRole("SUPERADMIN");
  } catch (error) {
    if (error instanceof AppError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }

  const [units, managers] = await Promise.all([listUnits(), listManagerCandidates()]);
  return { units, managers };
}
