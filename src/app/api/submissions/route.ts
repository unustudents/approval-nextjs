import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { listQuerySchema, submissionInputSchema } from "./_lib/schema";
import { createDraft, listSubmissions } from "./_lib/submission-service";

export async function GET(request: Request) {
  return handleApi(async () => {
    const user = await requireSession();
    const url = new URL(request.url);
    const filters = listQuerySchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    return listSubmissions(user, filters);
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireSession();
    const input = await parseJson(request, submissionInputSchema);
    return createDraft(user, input);
  });
}
