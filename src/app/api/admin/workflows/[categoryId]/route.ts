import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/authorization";
import { workflowInputSchema } from "@/app/(app)/admin/workflows/_lib/schema";
import { replaceWorkflow } from "@/app/(app)/admin/workflows/_lib/service";

type RouteContext = { params: Promise<{ categoryId: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await requireRole("SUPERADMIN");
    const { categoryId } = await params;
    return replaceWorkflow(categoryId, await parseJson(request, workflowInputSchema));
  });
}
