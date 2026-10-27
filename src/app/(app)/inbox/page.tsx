"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Building,
  User,
  Tags,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { StatusBadge, SubmissionStatus } from "@/components/StatusBadge";

interface InboxSubmission {
  id: string;
  number: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  requester: { id: string; name: string };
  unit: { id: string; name: string };
  category: { id: string; name: string };
  taskType: "APPROVAL" | "EXPLANATION";
  currentStep: {
    id: string;
    order: number;
  } | null;
}

export default function InboxPage() {
  const [inboxItems, setInboxItems] = useState<InboxSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadInbox() {
      try {
        const data = await api.get<InboxSubmission[]>("/api/approvals/inbox");
        if (!active) return;
        setInboxItems(data);
      } catch (err) {
        console.error("Gagal memuat inbox approval", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInbox();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Inbox Tugas Approval & Pertimbangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pengajuan pembelian yang memerlukan tindakan persetujuan atau
            catatan teknis Anda saat ini.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 self-start sm:self-auto">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>{inboxItems.length} Menunggu Tindakan</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Memeriksa antrean tugas approval Anda...
          </div>
        ) : inboxItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Semua tugas telah selesai diproses!
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tidak ada pengajuan yang membutuhkan persetujuan atau pertimbangan
              Anda saat ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {inboxItems.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {item.number}
                    </span>
                    <StatusBadge status={item.status} />
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-[#1E3A5F]">
                      {item.taskType === "EXPLANATION"
                        ? "Menunggu Penjelasan Anda"
                        : `Approval Tahap ${item.currentStep?.order}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {item.requester.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {item.unit.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tags className="w-3.5 h-3.5 text-slate-400" />
                      {item.category.name}
                    </span>
                    {item.submittedAt && (
                      <span>
                        Diajukan:{" "}
                        {new Date(item.submittedAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    href={`/submissions/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] shadow-xs transition-colors cursor-pointer"
                  >
                    Tinjau & Tindak Lanjuti
                    <ArrowRight className="w-3.5 h-3.5" />
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
