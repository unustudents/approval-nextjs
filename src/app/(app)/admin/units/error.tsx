"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function UnitsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mb-1 text-lg font-bold text-slate-900">Data Unit Tidak Dapat Dimuat</h2>
        <p className="mb-6 text-xs text-slate-600">Silakan coba memuat ulang halaman. Jika masalah berlanjut, hubungi administrator.</p>
        <button onClick={reset} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#152a45]">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Coba Muat Ulang
        </button>
      </div>
    </div>
  );
}
