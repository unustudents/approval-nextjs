import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/authorization";
import { updateUnitSchema } from "@/app/(app)/admin/units/_lib/schema";
import { updateUnit } from "@/app/(app)/admin/units/_lib/service";

type RouteContext = { params: Promise<{ unitId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await requireRole("SUPERADMIN");
    const { unitId } = await params;
    return updateUnit(unitId, await parseJson(request, updateUnitSchema));
  });
}
