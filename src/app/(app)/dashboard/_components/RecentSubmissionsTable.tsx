import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { StatusBadge, SubmissionStatus } from "@/components/StatusBadge";

export interface SubmissionSummary {
  id: string;
  number: string;
  status: SubmissionStatus;
  createdAt: string;
  submittedAt: string | null;
  requester: { id: string; name: string };
  unit: { id: string; name: string };
  category: { id: string; name: string };
}

export function RecentSubmissionsTable({
  submissions,
}: {
  submissions: SubmissionSummary[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Pengajuan Terbaru
          </h2>
          <p className="text-xs text-slate-500">
            Histori berkas pengadaan terkini di lingkungan kantor
          </p>
        </div>
        <Link
          href="/submissions"
          className="text-xs font-semibold text-[#1E3A5F] hover:text-[#142740] flex items-center gap-1"
        >
          Lihat Semua
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        {submissions.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">
              Belum ada data pengajuan
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pengajuan yang dibuat akan muncul di sini secara kronologis.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nomor Pengajuan</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Pemohon & Unit</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {submissions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">
                    {sub.number}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(sub.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">
                      {sub.requester.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {sub.unit.name}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                      {sub.category.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Link
                      href={`/submissions/${sub.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-[#1E3A5F] hover:text-[#142740]"
                    >
                      Detail
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
