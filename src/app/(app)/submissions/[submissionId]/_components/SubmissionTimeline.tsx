import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { roleDisplayName } from "@/components/StatusBadge";

export interface TimelineAction {
  id: string;
  action: string;
  resultingStatus: string;
  note: string | null;
  createdAt: string;
  actor: { id: string; name: string; role: string };
  submissionStep?: { order: number; type: string } | null;
}

export function SubmissionTimeline({ actions }: { actions: TimelineAction[] }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Histori & Audit Trail
        </h2>
        <span className="text-[10px] text-slate-400">Kronologis</span>
      </div>

      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {actions.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada riwayat tindakan.</p>
        ) : (
          actions.map((act) => {
            let icon = <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />;
            let dotBg = "bg-blue-100";
            if (act.action === "APPROVED") {
              icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
              dotBg = "bg-emerald-100";
            } else if (act.action === "REJECTED") {
              icon = <XCircle className="w-3.5 h-3.5 text-rose-600" />;
              dotBg = "bg-rose-100";
            } else if (act.action === "REVISION_REQUESTED") {
              icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
              dotBg = "bg-amber-100";
            } else if (act.action === "CONSIDERATION_GIVEN") {
              icon = <MessageSquare className="w-3.5 h-3.5 text-sky-600" />;
              dotBg = "bg-sky-100";
            }

            return (
              <div key={act.id} className="relative text-xs">
                <div
                  className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border border-white ${dotBg}`}
                >
                  {icon}
                </div>
                <div className="font-semibold text-slate-900">
                  {act.actor.name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span>{roleDisplayName(act.actor.role)}</span>
                  <span>&bull;</span>
                  <span>
                    {new Date(act.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mt-1 font-medium text-slate-700">
                  Aksi: <span className="font-bold">{act.action}</span>
                </div>
                {act.note && (
                  <div className="mt-1.5 p-2 rounded bg-slate-50 border border-slate-100 text-slate-600 text-[11px] whitespace-pre-line">
                    &ldquo;{act.note}&rdquo;
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
