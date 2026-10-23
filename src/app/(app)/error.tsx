"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Terjadi Kesalahan
        </h2>
        <p className="text-xs text-slate-600 mb-6">
          {error?.message ||
            "Gagal memuat halaman. Silakan coba beberapa saat lagi."}
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#152a45] transition-colors shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Coba Muat Ulang
        </button>
      </div>
    </div>
  );
}
