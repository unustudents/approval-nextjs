import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { actionSchema } from "../../_lib/schema";
import { actOnSubmission } from "../../_lib/submission-service";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireSession();
    const { submissionId } = await params;
    const input = await parseJson(request, actionSchema);
    return actOnSubmission(user, submissionId, input.action, input.note);
  });
}
