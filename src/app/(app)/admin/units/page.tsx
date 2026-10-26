"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Users,
  AlertCircle,
  Search,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";

interface AdminUnitItem {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  manager: { id: string; name: string } | null;
  _count: { members: number };
}

interface ManagerCandidate {
  id: string;
  name: string;
  roles: Array<{ role: string }>;
  status: string;
}

export default function AdminUnitsPage() {
  const [units, setUnits] = useState<AdminUnitItem[]>([]);
  const [managers, setManagers] = useState<ManagerCandidate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal create
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createManagerId, setCreateManagerId] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Modal edit
  const [editUnit, setEditUnit] = useState<AdminUnitItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  useEffect(() => {
    async function init() {
      try {
        const [unitList, userList] = await Promise.all([
          api.get<AdminUnitItem[]>("/api/admin/units"),
          api.get<ManagerCandidate[]>("/api/admin/users"),
        ]);
        setUnits(unitList);
        setManagers(
          userList.filter(
            (u) => u.roles.some(({ role }) => role === "UNIT_MANAGER") && u.status === "ACTIVE",
          ),
        );
      } catch (err) {
        console.error("Gagal memuat manajemen unit", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleCreateUnit(e: React.SubmitEvent) {
    e.preventDefault();
    setModalError("");
    if (!createName.trim()) {
      setModalError("Nama unit kerja wajib diisi");
      return;
    }

    setModalLoading(true);
    try {
      await api.post("/api/admin/units", {
        name: createName.trim(),
        managerId: createManagerId || null,
      });

      const updated = await api.get<AdminUnitItem[]>("/api/admin/units");
      setUnits(updated);
      setCreateOpen(false);
      setCreateName("");
      setCreateManagerId("");
    } catch (err) {
      if (err instanceof ApiError) setModalError(err.message);
      else setModalError("Gagal menambahkan unit kerja");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleUpdateUnit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!editUnit) return;
    setModalError("");
    setModalLoading(true);

    try {
      await api.patch(`/api/admin/units/${editUnit.id}`, {
        name: editName.trim(),
        managerId: editManagerId || null,
        status: editStatus,
      });

      const updated = await api.get<AdminUnitItem[]>("/api/admin/units");
      setUnits(updated);
      setEditUnit(null);
    } catch (err) {
      if (err instanceof ApiError) setModalError(err.message);
      else setModalError("Gagal memperbarui unit kerja");
    } finally {
      setModalLoading(false);
    }
  }

  const filteredUnits = units.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.manager?.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Unit Kerja
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola departemen/unit kantor dan tetapkan Manager Unit yang
            membawahi persetujuan pertama.
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
          Tambah Unit Baru
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari unit kerja atau nama manager..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Memuat daftar unit kerja...
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Tidak ada unit kerja yang sesuai
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Unit Kerja</th>
                  <th className="py-3 px-4">Manager Unit Penanggung Jawab</th>
                  <th className="py-3 px-4 text-center">Jumlah Anggota</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {u.name}
                    </td>
                    <td className="py-3 px-4">
                      {u.manager?.name ? (
                        <span className="font-medium text-slate-800">
                          {u.manager.name}
                        </span>
                      ) : (
                        <span className="text-amber-600 italic">
                          Belum ditentukan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        <Users className="w-3 h-3 text-slate-500" />
                        {u._count.members}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.status === "ACTIVE" ? (
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
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setModalError("");
                          setEditUnit(u);
                          setEditName(u.name);
                          setEditManagerId(u.manager?.id ?? "");
                          setEditStatus(u.status);
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
              Tambah Unit Kerja Baru
            </h3>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUnit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Nama Unit Kerja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Contoh: Unit TI & Komunikasi, Unit Logistik..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Manager Unit Penanggung Jawab
                </label>
                <select
                  value={createManagerId}
                  onChange={(e) => setCreateManagerId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="">(Belum ditentukan)</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Hanya pengguna aktif dengan role Manager Unit yang dapat
                  dipilih.
                </p>
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
                  {modalLoading ? "Menyimpan..." : "Simpan Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Ubah Unit Kerja
            </h3>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUnit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Nama Unit Kerja
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
                  Manager Unit Penanggung Jawab
                </label>
                <select
                  value={editManagerId}
                  onChange={(e) => setEditManagerId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="">(Belum ditentukan)</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Status Unit
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
                {editUnit._count.members > 0 && editStatus === "INACTIVE" && (
                  <p className="text-[10px] text-rose-500 mt-1">
                    Perhatian: Unit masih memiliki {editUnit._count.members}{" "}
                    anggota. Pindahkan anggota sebelum menonaktifkan.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUnit(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] rounded cursor-pointer"
                >
                  {modalLoading ? "Menyimpan..." : "Perbarui Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
