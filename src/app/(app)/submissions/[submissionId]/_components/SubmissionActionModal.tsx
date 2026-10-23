export interface ActionModalState {
  open: boolean;
  type: "APPROVE" | "REJECT" | "REQUEST_REVISION" | "CONSIDERATION" | null;
  title: string;
  note: string;
}

export function SubmissionActionModal({
  modalState,
  loading,
  onClose,
  onNoteChange,
  onConfirm,
}: {
  modalState: ActionModalState;
  loading: boolean;
  onClose: () => void;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
}) {
  if (!modalState.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          {modalState.title}
        </h3>
        <p className="text-xs text-slate-500">
          {modalState.type === "APPROVE"
            ? "Pengajuan akan disetujui dan dilanjutkan ke tahap berikutnya dalam workflow."
            : modalState.type === "REJECT"
              ? "Pengajuan akan ditolak secara permanen. Catatan alasan penolakan wajib dicantumkan."
              : modalState.type === "REQUEST_REVISION"
                ? "Pengajuan akan dikembalikan kepada pemohon untuk direvisi sesuai catatan Anda."
                : "Berikan masukan atau catatan profesional terkait aspek teknis barang yang diajukan."}
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan / Keterangan{" "}
            {modalState.type !== "APPROVE" && (
              <span className="text-rose-500">*</span>
            )}
          </label>
          <textarea
            rows={4}
            value={modalState.note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Tuliskan catatan pertimbangan, alasan, atau arahan revisi..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs placeholder:text-slate-400 focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-md transition-colors cursor-pointer ${
              modalState.type === "REJECT"
                ? "bg-rose-600 hover:bg-rose-700"
                : modalState.type === "REQUEST_REVISION"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-[#1E3A5F] hover:bg-[#162C47]"
            }`}
          >
            {loading ? "Memproses..." : "Konfirmasi Tindakan"}
          </button>
        </div>
      </div>
    </div>
  );
}
