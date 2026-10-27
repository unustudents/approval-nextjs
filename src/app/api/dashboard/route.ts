import { handleApi } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { getApprovalStats } from "@/app/(app)/dashboard/_lib/service";

export async function GET() {
  return handleApi(async () => {
    const user = await requireSession();
    return getApprovalStats(user);
  });
}
