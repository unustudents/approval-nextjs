import { handleApiError } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { readAttachment } from "../../../_lib/attachments";

type RouteContext = { params: Promise<{ submissionId: string; attachmentId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireSession();
    const { submissionId, attachmentId } = await params;
    const file = await readAttachment(user, submissionId, attachmentId);
    const dispositionName = encodeURIComponent(file.filename).replace(/['()]/g, (character) => `%${character.charCodeAt(0).toString(16)}`);

    return new Response(file.bytes, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.bytes.byteLength),
        "Content-Disposition": `attachment; filename*=UTF-8''${dispositionName}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
