"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  PlusCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/app/(app)/_components/AppShell";
import {
  StatusBadge,
  SubmissionStatus,
  roleDisplayName,
} from "@/components/StatusBadge";

interface SubmissionListItem {
  id: string;
  number: string;
  status: SubmissionStatus;
  createdAt: string;
  submittedAt: string | null;
  requester: { id: string; name: string };
  unit: { id: string; name: string };
  category: { id: string; name: string };
  currentStep?: {
    type: string;
    targetRole: string | null;
    targetUser?: { id: string; name: string } | null;
  } | null;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

const statusOptions: Array<{ value: string; label: string }> = [
  { value: "", label: "Semua Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "WAITING_UNIT_MANAGER", label: "Menunggu Manager Unit" },
  { value: "WAITING_FINANCE", label: "Menunggu Keuangan" },
  { value: "NEEDS_REVISION", label: "Perlu Revisi" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
];

export default function SubmissionsPage() {
  const user = useCurrentUser();
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 15,
    total: 0,
    pageCount: 1,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(
    async (page: number, q: string, status: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", "15");
        if (q.trim()) params.set("q", q.trim());
        if (status) params.set("status", status);

        const res = await api.get<{
          data: SubmissionListItem[];
          pagination: PaginationInfo;
        }>(`/api/submissions?${params.toString()}`);

        setSubmissions(res.data);
        setPagination(res.pagination);
      } catch (err) {
        console.error("Gagal memuat daftar pengajuan", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;

    async function loadInitialSubmissions() {
      try {
        const res = await api.get<{
          data: SubmissionListItem[];
          pagination: PaginationInfo;
        }>("/api/submissions?page=1&pageSize=15");
        if (!active) return;
        setSubmissions(res.data);
        setPagination(res.pagination);
      } catch (err) {
        console.error("Gagal memuat daftar pengajuan", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInitialSubmissions();
    return () => {
      active = false;
    };
  }, []);

  function handleSearchSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    fetchSubmissions(1, searchQuery, selectedStatus);
  }

  function handleStatusChange(status: string) {
    setSelectedStatus(status);
    fetchSubmissions(1, searchQuery, status);
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > pagination.pageCount) return;
    fetchSubmissions(newPage, searchQuery, selectedStatus);
  }

  function formatCurrentStep(sub: SubmissionListItem): string {
    if (sub.status === "APPROVED") return "Selesai (Disetujui)";
    if (sub.status === "REJECTED") return "Selesai (Ditolak)";
    if (sub.status === "DRAFT") return "Pemohon (Draft)";
    if (sub.status === "NEEDS_REVISION") return "Pemohon (Revisi Diperlukan)";

    if (sub.currentStep?.targetUser?.name) {
      return sub.currentStep.targetUser.name;
    }
    if (sub.currentStep?.targetRole) {
      return roleDisplayName(sub.currentStep.targetRole);
    }
    return "Sedang Diproses";
  }

  const isRequester = user?.roles.includes("REQUESTER") || user?.roles.includes("UNIT_MANAGER") || user?.roles.includes("SUPERADMIN");
  const canSeeRequesterColumn = user !== null && !user.roles.every((role) => role === "REQUESTER");

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Daftar Pengajuan Pembelian
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cari dan monitor status proses approval seluruh berkas pengadaan
            kantor.
          </p>
        </div>

        {isRequester && (
          <Link
            href="/submissions/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Buat Pengajuan Baru
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-3"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor pengajuan, nama pemohon, atau kategori..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-xs placeholder:text-slate-400 focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded-md text-xs text-slate-700 bg-white focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] cursor-pointer"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              Cari
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("");
                fetchSubmissions(1, "", "");
              }}
              title="Reset Filter"
              className="p-2 border border-slate-300 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Memuat data pengajuan...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                Tidak ada pengajuan ditemukan
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedStatus
                  ? "Tidak ada data yang cocok dengan kriteria pencarian Anda. Coba ubah kata kunci atau reset filter."
                  : "Belum ada berkas pengajuan dalam sistem. Pengajuan baru dapat dibuat oleh Kepala Unit atau Supervisor."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nomor Berkas</th>
                  <th className="py-3 px-4">Tanggal Pengajuan</th>
                  {canSeeRequesterColumn && (
                    <th className="py-3 px-4">Pemohon & Unit</th>
                  )}
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Posisi Saat Ini</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {sub.number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    {canSeeRequesterColumn && (
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {sub.requester.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {sub.unit.name}
                        </div>
                      </td>
                    )}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                        {sub.category.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <span className="font-medium">
                        {formatCurrentStep(sub)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/submissions/${sub.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-[#1E3A5F] hover:text-[#162C47] hover:underline"
                      >
                        Buka Detail &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && pagination.total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs text-slate-500">
            <div>
              Menampilkan{" "}
              <span className="font-medium text-slate-700">
                {(pagination.page - 1) * pagination.pageSize + 1}
              </span>{" "}
              -{" "}
              <span className="font-medium text-slate-700">
                {Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.total,
                )}
              </span>{" "}
              dari{" "}
              <span className="font-medium text-slate-700">
                {pagination.total}
              </span>{" "}
              pengajuan
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="p-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 text-slate-700 font-medium">
                {pagination.page} / {pagination.pageCount || 1}
              </span>

              <button
                type="button"
                disabled={pagination.page >= pagination.pageCount}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="p-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Halaman Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
