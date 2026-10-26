import "server-only";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authorization";
import { AppError } from "@/lib/errors";
import { listCategories } from "./service";

export async function getCategoriesPageData() {
  try { await requireRole("SUPERADMIN"); } catch (error) {
    if (error instanceof AppError && error.status === 401) redirect("/login");
    throw error;
  }
  return { categories: await listCategories() };
}
