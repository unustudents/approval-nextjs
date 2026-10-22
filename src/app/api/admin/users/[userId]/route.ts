import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/authorization";
import { updateUserSchema } from "../_lib/schema";
import { updateUser } from "../_lib/service";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const actor = await requireRole("SUPERADMIN");
    const { userId } = await params;
    const input = await parseJson(request, updateUserSchema);
    return updateUser(actor, userId, input);
  });
}
