import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/authorization";
import { updateCategorySchema } from "../_lib/schema";
import { updateCategory } from "../_lib/service";

type RouteContext = { params: Promise<{ categoryId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await requireRole("SUPERADMIN");
    const { categoryId } = await params;
    return updateCategory(categoryId, await parseJson(request, updateCategorySchema));
  });
}
