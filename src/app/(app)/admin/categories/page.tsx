"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  GitBranch,
  AlertCircle,
  Search,
  ArrowRight,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";

interface AdminCategoryItem {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  workflow?: { id: string; name: string; status: string } | null;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal create
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Modal edit
  const [editCat, setEditCat] = useState<AdminCategoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  useEffect(() => {
    async function init() {
      try {
        const catList = await api.get<AdminCategoryItem[]>(
          "/api/admin/categories",
        );
        setCategories(catList);
      } catch (err) {
        console.error("Gagal memuat kategori barang", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleCreateCategory(e: React.SubmitEvent) {
    e.preventDefault();
    setModalError("");
    if (!createName.trim()) {
      setModalError("Nama kategori wajib diisi");
      return;
    }

    setModalLoading(true);
    try {
      await api.post("/api/admin/categories", {
        name: createName.trim(),
      });

      const updated = await api.get<AdminCategoryItem[]>(
        "/api/admin/categories",
      );
      setCategories(updated);
      setCreateOpen(false);
      setCreateName("");
    } catch (err) {
      if (err instanceof ApiError) setModalError(err.message);
      else setModalError("Gagal menambahkan kategori");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleUpdateCategory(e: React.SubmitEvent) {
    e.preventDefault();
    if (!editCat) return;
    setModalError("");
    setModalLoading(true);

    try {
      await api.patch(`/api/admin/categories/${editCat.id}`, {
        name: editName.trim(),
        status: editStatus,
      });

      const updated = await api.get<AdminCategoryItem[]>(
        "/api/admin/categories",
      );
      setCategories(updated);
      setEditCat(null);
    } catch (err) {
      if (err instanceof ApiError) setModalError(err.message);
      else setModalError("Gagal memperbarui kategori");
    } finally {
      setModalLoading(false);
    }
  }

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Kategori Barang
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola kategori pengadaan dan atur tahapan workflow pertimbangan
            masing-masing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalError("");
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori Baru
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kategori barang..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Memuat kategori pengadaan...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Tidak ada kategori yang cocok
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Kategori</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Konfigurasi Workflow</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {c.name}
                    </td>
                    <td className="py-3 px-4">
                      {c.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/workflows?categoryId=${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-[#1E3A5F] hover:bg-blue-100 font-medium text-[11px] transition-colors"
                      >
                        <GitBranch className="w-3 h-3 text-[#1E3A5F]" />
                        Atur Workflow
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setModalError("");
                          setEditCat(c);
                          setEditName(c.name);
                          setEditStatus(c.status);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] hover:underline"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Tambah Kategori Barang
            </h3>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Contoh: Perangkat TI, Alat Tulis Kantor..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] rounded cursor-pointer"
                >
                  {modalLoading ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Ubah Kategori Barang
            </h3>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCategory} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Status Kategori
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as "ACTIVE" | "INACTIVE")
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditCat(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] rounded cursor-pointer"
                >
                  {modalLoading ? "Menyimpan..." : "Perbarui Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
