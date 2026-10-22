import { assertSameOrigin, handleApi } from "@/lib/http";
import { destroySession } from "@/lib/session";

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await destroySession();
    return { success: true };
  });
}
