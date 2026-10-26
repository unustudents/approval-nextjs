import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/authorization";
import { createCategorySchema } from "@/app/(app)/admin/categories/_lib/schema";
import { createCategory, listCategories } from "@/app/(app)/admin/categories/_lib/service";

export async function GET() {
  return handleApi(async () => {
    await requireRole("SUPERADMIN");
    return listCategories();
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await requireRole("SUPERADMIN");
    const { name } = await parseJson(request, createCategorySchema);
    return createCategory(name);
  });
}
