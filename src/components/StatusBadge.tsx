export type SubmissionStatus =
  | "DRAFT"
  | "WAITING_UNIT_MANAGER"
  | "WAITING_FINANCE"
  | "NEEDS_REVISION"
  | "APPROVED"
  | "REJECTED";

const statusConfig: Record<
  SubmissionStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    dot: "bg-slate-400",
  },
  WAITING_UNIT_MANAGER: {
    label: "Menunggu Manager Unit",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  WAITING_FINANCE: {
    label: "Menunggu Keuangan",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  NEEDS_REVISION: {
    label: "Perlu Revisi",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Disetujui",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Ditolak",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const config = statusConfig[status] ?? statusConfig.DRAFT;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}

export function roleDisplayName(role: string): string {
  switch (role) {
    case "REQUESTER":
      return "Kepala Unit / SPV";
    case "UNIT_MANAGER":
      return "Manager Unit";
    case "CONSIDERATION":
      return "Pemberi Pertimbangan";
    case "FINANCE_APPROVER":
      return "Approver Keuangan";
    case "GENERAL_AFFAIRS":
      return "TU / Umum";
    case "SUPERADMIN":
      return "Superadmin";
    default:
      return role;
  }
}
