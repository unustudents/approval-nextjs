import { handleApi } from "@/lib/http";
import { requireSession } from "@/lib/session";

export async function GET() {
  return handleApi(requireSession);
}
