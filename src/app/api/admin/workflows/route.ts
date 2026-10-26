import { handleApi } from "@/lib/http";
import { requireRole } from "@/lib/authorization";
import { listWorkflows } from "@/app/(app)/admin/workflows/_lib/service";

export async function GET() {
  return handleApi(async () => {
    await requireRole("SUPERADMIN");
    return listWorkflows();
  });
}
