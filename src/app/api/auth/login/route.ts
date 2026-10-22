import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { loginSchema } from "../_lib/login-schema";
import { login } from "../_lib/login";

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const input = await parseJson(request, loginSchema);
    const networkIdentifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    return login(input.username, input.password, networkIdentifier);
  });
}
