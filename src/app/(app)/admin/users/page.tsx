"use client";

import { useEffect, useState } from "react";
import {
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  AlertCircle,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { roleDisplayName } from "@/components/StatusBadge";

interface AdminUserItem {
  id: string;
  username: string;
  name: string;
  role: string;
  status: "ACTIVE" | "INACTIVE";
  unit: { id: string; name: string } | null;
  createdAt: string;
}

interface UnitOption {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal create
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formUsername, setFormUsername] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("REQUESTER");
  const [formUnitId, setFormUnitId] = useState<string>("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Modal edit
  const [editUser, setEditUser] = useState<AdminUserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editUnitId, setEditUnitId] = useState<string>("");
  const [editPassword, setEditPassword] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const [userList, unitList] = await Promise.all([
          api.get<AdminUserItem[]>("/api/admin/users"),
          api.get<UnitOption[]>("/api/admin/units"),
        ]);
        setUsers(userList);
        setUnits(unitList);
      } catch (err) {
        console.error("Gagal inisialisasi manajemen pengguna", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleCreateUser(e: React.SubmitEvent) {
    e.preventDefault();
    setFormError("");

    if (!formUsername.trim() || !formName.trim() || !formPassword) {
      setFormError("Semua field wajib diisi");
      return;
    }
    if (formPassword.length < 4) {
      setFormError("Password pengguna minimal 4 karakter");
      return;
    }

    setFormLoading(true);
    try {
      await api.post("/api/admin/users", {
        username: formUsername.trim().toLowerCase(),
        name: formName.trim(),
        password: formPassword,
        role: formRole,
        unitId: formUnitId || null,
      });

      const updated = await api.get<AdminUserItem[]>("/api/admin/users");
      setUsers(updated);
      setCreateModalOpen(false);
      setFormUsername("");
      setFormName("");
      setFormPassword("");
      setFormUnitId("");
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("Gagal menambahkan pengguna");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdateUser(e: React.SubmitEvent) {
    e.preventDefault();
    if (!editUser) return;
    setFormError("");
    setFormLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: editName.trim(),
        role: editRole,
        status: editStatus,
        unitId: editUnitId || null,
      };
      if (editPassword.trim()) {
        if (editPassword.length < 4) {
          setFormError("Password baru minimal 4 karakter");
          setFormLoading(false);
          return;
        }
        payload.password = editPassword;
      }

      await api.patch(`/api/admin/users/${editUser.id}`, payload);
      const updated = await api.get<AdminUserItem[]>("/api/admin/users");
      setUsers(updated);
      setEditUser(null);
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("Gagal memperbarui pengguna");
    } finally {
      setFormLoading(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      (u.unit?.name ?? "").toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Pengguna & Hak Akses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun pemohon, manager unit, pemberi pertimbangan, dan
            approver keuangan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Pengguna Baru
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan username, nama lengkap, atau unit kerja..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Memuat daftar pengguna...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Tidak ada pengguna yang sesuai
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Peran (Role)</th>
                  <th className="py-3 px-4">Unit Kerja</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {u.username}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {u.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                        {roleDisplayName(u.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.unit?.name ?? (
                        <span className="text-slate-400 italic">-</span>
                      )}
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
                          setFormError("");
                          setEditUser(u);
                          setEditName(u.name);
                          setEditRole(u.role);
                          setEditStatus(u.status);
                          setEditUnitId(u.unit?.id ?? "");
                          setEditPassword("");
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

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Tambah Akun Pengguna
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="misal: ahmad.fauzi"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama lengkap beserta gelar jika ada"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Password (Min 4 Karakter)
                </label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="REQUESTER">Kepala Unit / SPV</option>
                    <option value="UNIT_MANAGER">Manager Unit</option>
                    <option value="CONSIDERATION">Pemberi Pertimbangan</option>
                    <option value="FINANCE_APPROVER">Approver Keuangan</option>
                    <option value="GENERAL_AFFAIRS">TU / Umum</option>
                    <option value="SUPERADMIN">Superadmin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Unit Kerja
                  </label>
                  <select
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="">(Tanpa Unit / Terpusat)</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] rounded cursor-pointer"
                >
                  {formLoading ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Ubah Pengguna: {editUser.username}
            </h3>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="REQUESTER">Kepala Unit / SPV</option>
                    <option value="UNIT_MANAGER">Manager Unit</option>
                    <option value="CONSIDERATION">Pemberi Pertimbangan</option>
                    <option value="FINANCE_APPROVER">Approver Keuangan</option>
                    <option value="GENERAL_AFFAIRS">TU / Umum</option>
                    <option value="SUPERADMIN">Superadmin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Status Akun
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
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Unit Kerja
                </label>
                <select
                  value={editUnitId}
                  onChange={(e) => setEditUnitId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="">(Tanpa Unit / Terpusat)</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Ganti Password (Kosongkan jika tidak diubah)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Min 4 karakter jika ingin mengubah"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] rounded cursor-pointer"
                >
                  {formLoading ? "Menyimpan..." : "Perbarui Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
