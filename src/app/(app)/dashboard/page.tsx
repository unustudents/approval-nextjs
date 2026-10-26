"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Inbox, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/app/(app)/_components/AppShell";
import {
  DashboardStatsCards,
  DashboardStats,
} from "./_components/DashboardStatsCards";
import {
  RecentSubmissionsTable,
  SubmissionSummary,
} from "./_components/RecentSubmissionsTable";

export default function DashboardPage() {
  const user = useCurrentUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<
    SubmissionSummary[]
  >([]);
  const [inboxCount, setInboxCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const hasRole = (role: string) => user?.roles.includes(role) ?? false;

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [statsRes, submissionsRes] = await Promise.all([
          api.get<DashboardStats>("/api/dashboard"),
          api.get<{ data: SubmissionSummary[] }>("/api/submissions?pageSize=6"),
        ]);

        if (!active) return;
        setStats(statsRes);
        setRecentSubmissions(submissionsRes.data ?? []);

        if (
          hasRole("REQUESTER") || hasRole("UNIT_MANAGER") || hasRole("CONSIDERATION") || hasRole("FINANCE_APPROVER") || hasRole("SUPERADMIN")
        ) {
          const inboxRes = await api.get<unknown[]>("/api/approvals/inbox");
          if (active) setInboxCount(inboxRes.length);
        }
      } catch (err) {
        console.error("Gagal memuat dashboard", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dashboard Performa Approval
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau metrik kecepatan persetujuan dan status seluruh pengadaan
            kantor secara transparan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(hasRole("REQUESTER") || hasRole("SUPERADMIN")) && (
            <Link
              href="/submissions/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#152a45] shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Buat Pengajuan
            </Link>
          )}

          {(hasRole("REQUESTER") || hasRole("UNIT_MANAGER") || hasRole("CONSIDERATION") || hasRole("FINANCE_APPROVER") || hasRole("SUPERADMIN")) && (
            <Link
              href="/inbox"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            >
              <Inbox className="w-4 h-4 text-slate-600" />
              Inbox Tugas
              {inboxCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {inboxCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>

      {inboxCount > 0 && (
        <div className="flex items-start sm:items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Anda memiliki <strong>{inboxCount} pengajuan</strong> yang sedang
              menunggu tindakan persetujuan atau pertimbangan Anda.
            </span>
          </div>
          <Link
            href="/inbox"
            className="font-semibold text-amber-800 hover:text-amber-950 underline shrink-0 ml-4"
          >
            Proses Sekarang &rarr;
          </Link>
        </div>
      )}

      <DashboardStatsCards stats={stats} loading={loading} />

      <RecentSubmissionsTable submissions={recentSubmissions} />
    </div>
  );
}
