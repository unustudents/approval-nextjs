import { FileText, Download } from "lucide-react";

export interface AttachmentItem {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export function SubmissionAttachments({
  submissionId,
  attachments,
}: {
  submissionId: string;
  attachments: AttachmentItem[];
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Dokumen & Lampiran Pendukung
          </h2>
          <p className="text-[11px] text-slate-500">
            File bukti penawaran, spesifikasi teknis, atau foto pengadaan.
          </p>
        </div>
      </div>

      {attachments.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          Tidak ada lampiran dokumen untuk pengajuan ini.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-medium text-slate-800 truncate">
                  {att.originalFilename}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  ({(att.sizeBytes / 1024).toFixed(1)} KB)
                </span>
              </div>

              <a
                href={`/api/submissions/${submissionId}/attachments/${att.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-[#1E3A5F] hover:bg-slate-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
