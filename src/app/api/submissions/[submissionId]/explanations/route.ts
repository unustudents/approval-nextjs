import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { requestExplanationSchema } from "../../_lib/schema";
import { requestExplanation } from "../../_lib/submission-service";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireSession();
    const { submissionId } = await params;
    const input = await parseJson(request, requestExplanationSchema);
    return requestExplanation(user, submissionId, input.question);
  });
}
