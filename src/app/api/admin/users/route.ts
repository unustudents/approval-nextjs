import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/authorization";
import { createUserSchema } from "@/app/(app)/admin/users/_lib/schema";
import { createUser, listUsers } from "@/app/(app)/admin/users/_lib/service";

export async function GET() {
  return handleApi(async () => {
    await requireRole("SUPERADMIN");
    return listUsers();
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await requireRole("SUPERADMIN");
    const input = await parseJson(request, createUserSchema);
    return createUser(input);
  });
}
