import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { respondConsiderationSchema } from "../../../../_lib/schema";
import { respondToConsideration } from "../../../../_lib/submission-service";

type RouteContext = { params: Promise<{ submissionId: string; requestId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireSession();
    const { submissionId, requestId } = await params;
    const input = await parseJson(request, respondConsiderationSchema);
    return respondToConsideration(user, submissionId, requestId, input.response);
  });
}
