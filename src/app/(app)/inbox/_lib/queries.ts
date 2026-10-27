import "server-only";
import { requireSession } from "@/lib/session";
import { listInboxTasks } from "./service";

export async function getInboxPageData() {
  const user = await requireSession();
  return { inboxItems: await listInboxTasks(user) };
}
