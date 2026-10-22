import { assertSameOrigin, handleApi } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { submitDraft } from "../../_lib/submission-service";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireSession();
    const { submissionId } = await params;
    return submitDraft(user, submissionId);
  });
}
