import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { requestConsiderationSchema } from "../../_lib/schema";
import { listConsiderationCandidates, requestConsideration } from "../../_lib/submission-service";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  return handleApi(async () => {
    const user = await requireSession();
    const { submissionId } = await params;
    return listConsiderationCandidates(user, submissionId);
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireSession();
    const { submissionId } = await params;
    const input = await parseJson(request, requestConsiderationSchema);
    return requestConsideration(user, submissionId, input.recipientId, input.message);
  });
}
