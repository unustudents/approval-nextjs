import "server-only";
import Link from "next/link";
import {
  CheckCircle2,
  ShoppingCart,
  Boxes,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  Inbox,
  FileText,
  Clock,
  ChevronRight,
  Layers,
  Check,
} from "lucide-react";
import { requireSession, type SessionUser } from "@/lib/session";
import { getInboxTaskCount } from "@/app/(app)/dashboard/_lib/service";
import { roleDisplayName } from "@/components/StatusBadge";

export const metadata = {
  title: "Portal Layanan Terpadu - Menu Utama",
  description: "Pusat akses modul pengadaan, persetujuan, logistik, dan manajemen operasional kantor.",
};

const inboxRoles: readonly SessionUser["roles"][number][] = [
  "REQUESTER",
  "UNIT_MANAGER",
  "CONSIDERATION",
  "FINANCE_APPROVER",
  "SUPERADMIN",
] as const;

export default async function PortalPage() {
  const user = await requireSession();
  const canAccessInbox = user.roles.some((role) => inboxRoles.includes(role));
  const inboxCount = canAccessInbox ? await getInboxTaskCount(user) : 0;

  const isSuperadmin = user.roles.includes("SUPERADMIN");
  const isRequester =
    user.roles.includes("REQUESTER") ||
    user.roles.includes("UNIT_MANAGER") ||
    isSuperadmin;

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A5F] via-[#2A4D78] to-[#1E3A5F] p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-medium text-blue-100 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Portal Terpadu Operasional Kantor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Selamat datang, {user.name}
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              Pusat akses terintegrasi untuk pengajuan belanja kantor, pengadaan barang, manajemen persediaan, dan administrasi operasional.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/15 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-white">
                {user.roles.map(roleDisplayName).join(", ")}
              </div>
              <div className="text-[11px] text-blue-100">
                @{user.username}
              </div>
            </div>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-blue-400/10 pointer-events-none blur-2xl" />
      </div>

      {/* Modules Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1E3A5F]" />
            Daftar Modul Aplikasi
          </h2>
          <p className="text-xs text-slate-500">
            Pilih modul di bawah ini untuk memulai pekerjaan Anda.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs inline-flex items-center gap-2 self-start">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Sistem Multi-Modul Aktif
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD 1: Office Approval (ACTIVE) */}
        <div className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group">
          <div className="h-2 bg-[#1E3A5F]" />
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A5F] border border-blue-100 flex items-center justify-center shadow-2xs group-hover:bg-[#1E3A5F] group-hover:text-white transition-colors duration-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Modul Aktif
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1E3A5F] transition-colors">
              Office Approval
            </h3>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Sistem Pengajuan & Persetujuan Kantor
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 flex-1">
              Pengelolaan pengajuan belanja operasional kantor, verifikasi berjenjang (Unit Manager & Finance), catatan disposisi, dan audit trail persetujuan anggaran.
            </p>

            {/* Live Stats Pill */}
            {inboxCount > 0 ? (
              <div className="mb-5 flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tindakan Menunggu:</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                  {inboxCount} pengajuan
                </span>
              </div>
            ) : (
              <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-xs">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Semua pengajuan telah ditindaklanjuti.</span>
              </div>
            )}

            {/* Quick Links inside Card */}
            <div className="space-y-2 mb-5 pt-3 border-t border-slate-100 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Akses Cepat
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/submissions"
                  className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Daftar Pengajuan</span>
                </Link>
                {isRequester && (
                  <Link
                    href="/submissions/new"
                    className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    <span>Buat Baru</span>
                  </Link>
                )}
                {canAccessInbox && (
                  <Link
                    href="/inbox"
                    className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors col-span-2 sm:col-span-1"
                  >
                    <Inbox className="w-3.5 h-3.5 text-amber-600" />
                    <span>Inbox Review</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Primary Action Button */}
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162c47] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Buka Modul Approval</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* CARD 2: Purchasing & Procurement (PLANNED) */}
        <div className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group">
          <div className="h-2 bg-emerald-600" />
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <Clock className="w-3 h-3 text-sky-600" />
                Segera Hadir
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Purchasing & Vendor
            </h3>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Pengadaan & Pesanan Pembelian (PO)
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 flex-1">
              Pengelolaan pesanan pembelian (Purchase Order / PO), katalog rekanan pemasok (vendor), penawaran harga, dan surat bukti penerimaan barang (Goods Receipt).
            </p>

            {/* Planned Highlights */}
            <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Rencana Fitur Utama:
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Auto-generate PO dari Approval disetujui</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Database rekanan & rekap penawaran vendor</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Pencatatan faktur & bukti terima barang</span>
                </li>
              </ul>
            </div>

            {/* Card Status Action */}
            <div className="mt-auto">
              <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed border border-slate-200">
                <span>Dalam Tahap Perencanaan</span>
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Akan terintegrasi langsung dengan hasil pengajuan Approval.
              </p>
            </div>
          </div>
        </div>

        {/* CARD 3: Inventory & Warehouse (PLANNED) */}
        <div className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group">
          <div className="h-2 bg-amber-600" />
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shadow-2xs group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
                <Boxes className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                Segera Hadir
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
              Inventory & Logistik
            </h3>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Manajemen Stok & Gudang Kantor
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 flex-1">
              Pelacakan persediaan stok barang operasional kantor, manajemen multi-gudang, kartu stok digital, mutasi antar unit, dan peringatan stok minimum.
            </p>

            {/* Planned Highlights */}
            <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Rencana Fitur Utama:
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Stok otomatis bertambah saat barang PO tiba</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Kartu stok digital & mutasi antar unit kerja</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Peringatan stok menipis (Low Stock Alert)</span>
                </li>
              </ul>
            </div>

            {/* Card Status Action */}
            <div className="mt-auto">
              <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed border border-slate-200">
                <span>Dalam Tahap Perencanaan</span>
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Sinkronisasi otomatis dengan penerimaan barang dari modul Purchasing.
              </p>
            </div>
          </div>
        </div>

        {/* CARD 4: Master Data & System Admin (SUPERADMIN ONLY) */}
        {isSuperadmin && (
          <div className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group lg:col-span-3">
            <div className="h-2 bg-indigo-600" />
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      Master Data & Administrasi Sistem
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 uppercase tracking-wider">
                      Superadmin
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-2xl">
                    Konfigurasi dasar organisasi bersama yang digunakan oleh seluruh modul: pengelolaan akun pengguna, struktur unit kerja, hak akses, dan kategori belanja.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link
                  href="/admin/users"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Pengguna</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/admin/units"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Unit Kerja</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/admin/categories"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Kategori Barang</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integration Roadmap Synergy Banner */}
      <div className="mt-10 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Konsep Alur Kerja Terintegrasi (End-to-End Workflow)
        </h4>
        <p className="text-xs text-slate-500 mb-6 max-w-3xl">
          Ketika seluruh modul aktif, operasional kantor akan berjalan mulus dalam satu rantai proses otomatis tanpa rekap manual berulang:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between">
            <div>
              <div className="font-bold text-[#1E3A5F] flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                Approval Module
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Unit kerja membuat pengajuan kebutuhan belanja barang. Dilakukan verifikasi bertingkat hingga berstatus <b>Disetujui (Approved)</b>.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-blue-700 font-semibold flex items-center gap-1">
              <span>Hasil: Form Pengajuan Terverifikasi</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="font-bold text-emerald-800 flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                Purchasing Module
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Pengajuan yang disetujui otomatis menjadi draf <b>Purchase Order (PO)</b>. Tim Purchasing menerbitkan PO ke vendor rekanan resmi.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <span>Hasil: PO Terbit & Dikirim ke Vendor</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
            <div>
              <div className="font-bold text-amber-800 flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                Inventory Module
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Barang yang dikirim vendor diperiksa dan diterima. Stok di gudang otomatis bertambah dan siap didistribusikan ke unit pemohon.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-amber-700 font-semibold flex items-center gap-1">
              <span>Hasil: Stok Gudang Terupdate Realtime</span>
              <Check className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

