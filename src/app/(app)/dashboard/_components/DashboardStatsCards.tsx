import {
  CheckCircle2,
  // Clock,
  FileText,
  Hourglass,
  type LucideIcon,
  XCircle,
} from "lucide-react";

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

interface DashboardStatCardProps {
  title: string;
  icon: LucideIcon;
  iconClassName: string;
  value: number | string;
  footer: string;
  footerIndicatorClassName?: string;
}

export function DashboardStatCard({
  title,
  icon: Icon,
  iconClassName,
  value,
  footer,
  footerIndicatorClassName,
}: DashboardStatCardProps) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClassName}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
        {footerIndicatorClassName ? (
          <span className={`w-1.5 h-1.5 rounded-full ${footerIndicatorClassName}`} />
        ) : null}
        {footer}
      </p>
    </div>
  );
}

export function DashboardStatsCards({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  const cards: DashboardStatCardProps[] = [
    /*
    {
      title: "Rata-Rata Waktu Approval",
      icon: Clock,
      iconClassName: "bg-blue-50 text-blue-700",
      value: loading
        ? "..."
        : formatDuration(stats?.averageApprovalMilliseconds ?? null),
      footer: "Target SLA: Maksimal 1 hari kerja",
      footerIndicatorClassName: "bg-emerald-500",
    },
    */
    {
      title: "Total Pengajuan",
      icon: FileText,
      iconClassName: "bg-blue-50 text-blue-700",
      value: loading
        ? "..."
        : (stats?.pending ?? 0) +
          (stats?.approved ?? 0) +
          (stats?.rejected ?? 0),
      footer: "Total pengajuan yang telah dikirim",
    },
    {
      title: "Pengajuan Pending",
      icon: Hourglass,
      iconClassName: "bg-amber-50 text-amber-700",
      value: loading ? "..." : (stats?.pending ?? 0),
      footer: "Menunggu persetujuan / revisi",
    },
    {
      title: "Pengajuan Disetujui",
      icon: CheckCircle2,
      iconClassName: "bg-emerald-50 text-emerald-700",
      value: loading ? "..." : (stats?.approved ?? 0),
      footer: "Selesai dengan approval final",
    },
    {
      title: "Pengajuan Ditolak",
      icon: XCircle,
      iconClassName: "bg-rose-50 text-rose-700",
      value: loading ? "..." : (stats?.rejected ?? 0),
      footer: "Tidak disetujui dalam proses approval",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <DashboardStatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
