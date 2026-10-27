import "server-only";
import { listSubmissions } from "@/app/api/submissions/_lib/submission-service";
import { requireSession, type SessionUser } from "@/lib/session";
import { getApprovalStats, getInboxTaskCount } from "./service";

const inboxRoles: readonly SessionUser["roles"][number][] = [
  "REQUESTER",
  "UNIT_MANAGER",
  "CONSIDERATION",
  "FINANCE_APPROVER",
  "SUPERADMIN",
] as const;

export async function getDashboardPageData() {
  const user = await requireSession();
  const canAccessInbox = user.roles.some((role) => inboxRoles.includes(role));
  const [stats, recentSubmissions, inboxCount] = await Promise.all([
    getApprovalStats(user),
    listSubmissions(user, { page: 1, pageSize: 6 }),
    canAccessInbox ? getInboxTaskCount(user) : Promise.resolve(0),
  ]);

  return {
    user,
    stats,
    recentSubmissions: recentSubmissions.data,
    inboxCount,
    canAccessInbox,
  };
}
