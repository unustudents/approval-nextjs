import { Clock, Hourglass, CheckCircle2, XCircle } from "lucide-react";

export interface DashboardStats {
  pending: number;
  approved: number;
  rejected: number;
  averageApprovalMilliseconds: number | null;
}

export function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return "Belum ada data";
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(ms / (1000 * 60)));
    return `${minutes} menit`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} jam`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)} hari kerja`;
}

export function DashboardStatsCards({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Rata-Rata Waktu Approval
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {loading
            ? "..."
            : formatDuration(stats?.averageApprovalMilliseconds ?? null)}
        </div>
        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Target SLA: Maksimal 1 hari kerja
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Pengajuan Pending
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Hourglass className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {loading ? "..." : (stats?.pending ?? 0)}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Menunggu persetujuan / revisi
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Pengajuan Disetujui
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {loading ? "..." : (stats?.approved ?? 0)}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Selesai dengan approval final
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Pengajuan Ditolak
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {loading ? "..." : (stats?.rejected ?? 0)}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Tidak disetujui dalam workflow
        </p>
      </div>
    </div>
  );
}
