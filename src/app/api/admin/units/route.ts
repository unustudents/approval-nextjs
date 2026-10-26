import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/authorization";
import { createUnitSchema } from "@/app/(app)/admin/units/_lib/schema";
import { createUnit, listUnits } from "@/app/(app)/admin/units/_lib/service";

export async function GET() {
  return handleApi(async () => {
    await requireRole("SUPERADMIN");
    return listUnits();
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await requireRole("SUPERADMIN");
    return createUnit(await parseJson(request, createUnitSchema));
  });
}
