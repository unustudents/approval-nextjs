import { handleApi } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { listManagedUnits } from "../_lib/submission-service";

export async function GET() {
  return handleApi(async () => listManagedUnits(await requireSession()));
}
