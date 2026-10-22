import { assertSameOrigin, handleApi } from "@/lib/http";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/session";
import { storeAttachment } from "../../_lib/attachments";
import { getSubmission } from "../../_lib/submission-service";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireSession();
    const { submissionId } = await params;
    await getSubmission(user, submissionId);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new AppError("Field file wajib diisi", 400, "FILE_REQUIRED");
    return storeAttachment(user, submissionId, file);
  });
}
