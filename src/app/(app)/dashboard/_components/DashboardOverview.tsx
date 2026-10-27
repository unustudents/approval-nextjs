import Link from "next/link";
import { AlertTriangle, Inbox, PlusCircle } from "lucide-react";
import { DashboardStatsCards } from "./DashboardStatsCards";
import { RecentSubmissionsTable } from "./RecentSubmissionsTable";
import type { DashboardStats, SubmissionSummary } from "../_lib/model";
import type { SessionUser } from "@/lib/session";

export function DashboardOverview({
  user,
  stats,
  recentSubmissions,
  inboxCount,
  canAccessInbox,
}: {
  user: SessionUser;
  stats: DashboardStats;
  recentSubmissions: SubmissionSummary[];
  inboxCount: number;
  canAccessInbox: boolean;
}) {
  const canCreateSubmission = user.roles.some((role) =>
    ["REQUESTER", "UNIT_MANAGER", "SUPERADMIN"].includes(role),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dashboard Performa Approval
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Pantau metrik kecepatan persetujuan dan status seluruh pengadaan
            kantor secara transparan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canCreateSubmission ? (
            <Link
              href="/submissions/new"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#152a45]"
            >
              <PlusCircle className="size-4" aria-hidden="true" />
              Buat Pengajuan
            </Link>
          ) : null}

          {canAccessInbox ? (
            <Link
              href="/inbox"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs transition-colors hover:bg-slate-50"
            >
              <Inbox className="size-4 text-slate-600" aria-hidden="true" />
              Inbox Tugas
              {inboxCount > 0 ? (
                <span className="ml-1 rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  {inboxCount}
                </span>
              ) : null}
            </Link>
          ) : null}
        </div>
      </div>

      {inboxCount > 0 ? (
        <div className="flex items-start justify-between rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 sm:items-center">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" aria-hidden="true" />
            <span>
              Anda memiliki <strong>{inboxCount} pengajuan</strong> yang sedang
              menunggu tindakan persetujuan atau pertimbangan Anda.
            </span>
          </div>
          <Link
            href="/inbox"
            className="ml-4 shrink-0 font-semibold text-amber-800 underline hover:text-amber-950"
          >
            Proses Sekarang &rarr;
          </Link>
        </div>
      ) : null}

      <DashboardStatsCards stats={stats} />
      <RecentSubmissionsTable submissions={recentSubmissions} />
    </div>
  );
}
