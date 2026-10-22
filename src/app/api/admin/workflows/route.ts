import { handleApi } from "@/lib/http";
import { requireRole } from "@/lib/authorization";
import { listWorkflows } from "./_lib/service";

export async function GET() {
  return handleApi(async () => {
    await requireRole("SUPERADMIN");
    return listWorkflows();
  });
}
