import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText, Filter, PlusCircle, RefreshCw, Search } from "lucide-react";
import { listQuerySchema } from "@/app/api/submissions/_lib/schema";
import { listSubmissions } from "@/app/api/submissions/_lib/submission-service";
import { StatusBadge, roleDisplayName } from "@/components/StatusBadge";
import { requireSession } from "@/lib/session";

const statusOptions = [
  { value: "", label: "Semua Status" }, { value: "DRAFT", label: "Draft" },
  { value: "WAITING_UNIT_MANAGER", label: "Menunggu Manager Unit" }, { value: "WAITING_FINANCE", label: "Menunggu Keuangan" },
  { value: "NEEDS_REVISION", label: "Perlu Revisi" }, { value: "APPROVED", label: "Disetujui" }, { value: "REJECTED", label: "Ditolak" },
];
type SearchParams = { q?: string; status?: string; page?: string };

function submissionUrl({ q, status, page }: SearchParams) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (page && page !== "1") params.set("page", page);
  const query = params.toString();
  return query ? `/submissions?${query}` : "/submissions";
}

function formatCurrentStep(submission: { status: string; currentStep?: { targetRole: string | null; targetUser?: { name: string } | null } | null }) {
  if (submission.status === "APPROVED") return "Selesai (Disetujui)";
  if (submission.status === "REJECTED") return "Selesai (Ditolak)";
  if (submission.status === "DRAFT") return "Pemohon (Draft)";
  if (submission.status === "NEEDS_REVISION") return "Pemohon (Revisi Diperlukan)";
  return submission.currentStep?.targetUser?.name ?? (submission.currentStep?.targetRole ? roleDisplayName(submission.currentStep.targetRole) : "Sedang Diproses");
}

export default function SubmissionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <Suspense fallback={<SubmissionsLoading />}><SubmissionsPageContent searchParams={searchParams} /></Suspense>;
}

async function SubmissionsPageContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [user, rawSearchParams] = await Promise.all([requireSession(), searchParams]);
  const parsedFilters = listQuerySchema.safeParse({ ...rawSearchParams, pageSize: 15 });
  const filters = parsedFilters.success ? parsedFilters.data : { q: undefined, status: undefined, page: 1, pageSize: 15 };
  const { data: submissions, pagination } = await listSubmissions(user, filters);
  const isRequester = user.roles.some((role) => ["REQUESTER", "UNIT_MANAGER", "SUPERADMIN"].includes(role));
  const canSeeRequesterColumn = !user.roles.every((role) => role === "REQUESTER");
  const activeQuery = filters.q ?? "";
  const activeStatus = filters.status ?? "";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-xl font-bold tracking-tight text-slate-900">Daftar Pengajuan Pembelian</h1><p className="mt-0.5 text-xs text-slate-500">Cari dan monitor status proses approval seluruh berkas pengadaan kantor.</p></div>
        {isRequester ? <Link href="/submissions/new" className="inline-flex self-start items-center gap-2 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#162C47] sm:self-auto"><PlusCircle className="size-4" aria-hidden="true" />Buat Pengajuan Baru</Link> : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <form className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          <div className="relative flex-1"><Search className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400" aria-hidden="true" /><input name="q" type="search" defaultValue={activeQuery} placeholder="Cari nomor pengajuan, nama pemohon, atau kategori..." className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]" /></div>
          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]"><Filter className="pointer-events-none absolute inset-y-0 left-3 my-auto size-3.5 text-slate-400" aria-hidden="true" /><select name="status" defaultValue={activeStatus} className="w-full cursor-pointer rounded-md border border-slate-300 bg-white py-2 pl-8 pr-8 text-xs text-slate-700 focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
            <button type="submit" className="cursor-pointer rounded-md bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-200">Cari</button>
            <Link href="/submissions" title="Reset Filter" className="rounded-md border border-slate-300 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"><RefreshCw className="size-3.5" aria-hidden="true" /><span className="sr-only">Reset Filter</span></Link>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          {submissions.length === 0 ? <div className="p-12 text-center"><FileText className="mx-auto mb-3 size-10 text-slate-300" aria-hidden="true" /><p className="text-sm font-semibold text-slate-700">Tidak ada pengajuan ditemukan</p><p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">{activeQuery || activeStatus ? "Tidak ada data yang cocok dengan kriteria pencarian Anda. Coba ubah kata kunci atau reset filter." : "Belum ada berkas pengajuan dalam sistem. Pengajuan baru dapat dibuat oleh Kepala Unit atau Supervisor."}</p></div> : (
            <table className="w-full text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-600"><tr><th className="px-4 py-3">Nomor Berkas</th><th className="px-4 py-3">Tanggal Pengajuan</th>{canSeeRequesterColumn ? <th className="px-4 py-3">Pemohon & Unit</th> : null}<th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Posisi Saat Ini</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Tindakan</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">{submissions.map((submission) => <tr key={submission.id} className="transition-colors hover:bg-slate-50/80"><td className="whitespace-nowrap px-4 py-3.5 font-mono font-semibold text-slate-900">{submission.number}</td><td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{submission.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>{canSeeRequesterColumn ? <td className="px-4 py-3.5"><div className="font-medium text-slate-900">{submission.requester.name}</div><div className="text-[11px] text-slate-400">{submission.unit.name}</div></td> : null}<td className="whitespace-nowrap px-4 py-3.5"><span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{submission.category.name}</span></td><td className="whitespace-nowrap px-4 py-3.5 text-slate-600"><span className="font-medium">{formatCurrentStep(submission)}</span></td><td className="whitespace-nowrap px-4 py-3.5"><StatusBadge status={submission.status} /></td><td className="whitespace-nowrap px-4 py-3.5 text-right">{submission.status === "DRAFT" && submission.requester.id === user.id ? <Link href={`/submissions/${submission.id}?edit=1`} className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 hover:underline">Edit Draft &rarr;</Link> : <Link href={`/submissions/${submission.id}`} className="inline-flex items-center gap-1 font-semibold text-[#1E3A5F] hover:text-[#162C47] hover:underline">Buka Detail &rarr;</Link>}</td></tr>)}</tbody>
            </table>
          )}
        </div>
        {pagination.total > 0 ? <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3.5 text-xs text-slate-500 sm:flex-row"><div>Menampilkan <span className="font-medium text-slate-700">{(pagination.page - 1) * pagination.pageSize + 1}</span> - <span className="font-medium text-slate-700">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> dari <span className="font-medium text-slate-700">{pagination.total}</span> pengajuan</div><div className="flex items-center gap-2">{pagination.page > 1 ? <Link href={submissionUrl({ q: activeQuery, status: activeStatus, page: String(pagination.page - 1) })} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50" aria-label="Halaman Sebelumnya"><ChevronLeft className="size-4" aria-hidden="true" /></Link> : <span className="rounded-md border border-slate-200 p-1.5 text-slate-400" aria-hidden="true"><ChevronLeft className="size-4" /></span>}<span className="px-2 font-medium text-slate-700">{pagination.page} / {pagination.pageCount || 1}</span>{pagination.page < pagination.pageCount ? <Link href={submissionUrl({ q: activeQuery, status: activeStatus, page: String(pagination.page + 1) })} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50" aria-label="Halaman Berikutnya"><ChevronRight className="size-4" aria-hidden="true" /></Link> : <span className="rounded-md border border-slate-200 p-1.5 text-slate-400" aria-hidden="true"><ChevronRight className="size-4" /></span>}</div></div> : null}
      </div>
    </div>
  );
}

function SubmissionsLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="space-y-2"><div className="h-6 w-64 rounded bg-slate-200" /><div className="h-4 w-full max-w-xl rounded bg-slate-100" /></div>
      <div className="h-16 rounded-xl border border-slate-200 bg-white" />
      <div className="h-96 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
