import { handleApi } from "@/lib/http";
import { requireRole } from "@/lib/authorization";
import { getApprovalStats } from "./_lib/stats";

export async function GET() {
  return handleApi(async () => {
    await requireRole("SUPERADMIN", "GENERAL_AFFAIRS", "FINANCE_APPROVER");
    return getApprovalStats();
  });
}
