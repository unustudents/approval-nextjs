import Link from "next/link";
import {
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  Tags,
  User,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { InboxItem } from "../_lib/model";

export function InboxOverview({ inboxItems }: { inboxItems: InboxItem[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Inbox Tugas Approval & Pertimbangan
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Daftar pengajuan pembelian yang memerlukan tindakan persetujuan atau
            catatan teknis Anda saat ini.
          </p>
        </div>

        <div className="inline-flex self-start items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 sm:self-auto">
          <Clock className="size-4 text-amber-600" aria-hidden="true" />
          <span>{inboxItems.length} Menunggu Tindakan</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {inboxItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Semua tugas telah selesai diproses!
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
              Tidak ada pengajuan yang membutuhkan persetujuan atau pertimbangan
              Anda saat ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {inboxItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {item.number}
                    </span>
                    <StatusBadge status={item.status} />
                    <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-[#1E3A5F]">
                      {item.taskType === "EXPLANATION"
                        ? "Menunggu Penjelasan Anda"
                        : `Approval Tahap ${item.currentStep?.order}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="size-3.5 text-slate-400" aria-hidden="true" />
                      {item.requester.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="size-3.5 text-slate-400" aria-hidden="true" />
                      {item.unit.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tags className="size-3.5 text-slate-400" aria-hidden="true" />
                      {item.category.name}
                    </span>
                    {item.submittedAt ? (
                      <span>
                        Diajukan: {" "}
                        {item.submittedAt.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    href={`/submissions/${item.id}`}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#162C47]"
                  >
                    Tinjau & Tindak Lanjuti
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
