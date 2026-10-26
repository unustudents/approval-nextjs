import { assertSameOrigin, handleApi, parseJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { updateSubmissionSchema } from "../_lib/schema";
import {
  deleteUnansweredSubmission,
  getSubmission,
  updateSubmission,
} from "../_lib/submission-service";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    const user = await requireSession();
    const { submissionId } = await params;
    return getSubmission(user, submissionId);
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireSession();
    const { submissionId } = await params;
    const input = await parseJson(request, updateSubmissionSchema);
    return updateSubmission(user, submissionId, input);
  });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireSession();
    const { submissionId } = await params;
    return deleteUnansweredSubmission(user, submissionId);
  });
}
