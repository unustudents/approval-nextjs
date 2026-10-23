import { handleApi } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { getApprovalStats } from "./_lib/stats";

export async function GET() {
  return handleApi(async () => {
    await requireSession();
    return getApprovalStats();
  });
}
