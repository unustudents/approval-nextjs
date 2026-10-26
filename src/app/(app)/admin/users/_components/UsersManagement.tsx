"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Edit2, Search, UserPlus, XCircle } from "lucide-react";
import { roleDisplayName } from "@/components/StatusBadge";
import { createUserAction, updateUserAction } from "../_lib/actions";
import { availableRoles, type AdminUser, type UnitOption } from "../_lib/model";

type UsersManagementProps = { users: AdminUser[]; units: UnitOption[] };

export function UsersManagement({ users, units }: UsersManagementProps) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<string[]>(["REQUESTER"]);
  const [unitId, setUnitId] = useState("");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editError, setEditError] = useState("");
  const [editName, setEditName] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editUnitId, setEditUnitId] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetCreateForm() {
    setCreateOpen(false); setCreateError(""); setUsername(""); setName(""); setPassword(""); setRoles(["REQUESTER"]); setUnitId("");
  }

  function resetEditForm() {
    setEditUser(null); setEditError(""); setEditName(""); setEditRoles([]); setEditStatus("ACTIVE"); setEditUnitId(""); setEditPassword("");
  }

  useLayoutEffect(() => () => { resetCreateForm(); resetEditForm(); }, []);

  function toggleRole(role: string, setValue: React.Dispatch<React.SetStateAction<string[]>>) {
    setValue((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  }

  function openEdit(user: AdminUser) {
    setEditError(""); setEditUser(user); setEditName(user.name); setEditRoles(user.roles.map((assignment) => assignment.role)); setEditStatus(user.status); setEditUnitId(user.unit?.id ?? ""); setEditPassword("");
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCreateError("");
    startTransition(async () => {
      const result = await createUserAction({ username, name, password, roles, unitId: unitId || null });
      if (result.ok) resetCreateForm(); else setCreateError(result.message);
    });
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editUser) return; setEditError("");
    startTransition(async () => {
      const result = await updateUserAction(editUser.id, { name: editName, roles: editRoles, status: editStatus, unitId: editUnitId || null, ...(editPassword ? { password: editPassword } : {}) });
      if (result.ok) resetEditForm(); else setEditError(result.message);
    });
  }

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();
    return user.username.toLowerCase().includes(query) || user.name.toLowerCase().includes(query) || (user.unit?.name ?? "").toLowerCase().includes(query) || user.roles.some((assignment) => assignment.role.toLowerCase().includes(query));
  });

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-bold tracking-tight text-slate-900">Manajemen Pengguna & Hak Akses</h1><p className="mt-0.5 text-xs text-slate-500">Kelola akun pemohon, manager unit, pemberi pertimbangan, dan approver keuangan.</p></div><button type="button" onClick={() => { resetCreateForm(); setCreateOpen(true); }} className="inline-flex self-start cursor-pointer items-center gap-2 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#162C47] sm:self-auto"><UserPlus className="h-4 w-4" aria-hidden="true" />Tambah Pengguna Baru</button></div>
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" /><label className="sr-only" htmlFor="user-search">Cari pengguna</label><input id="user-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari berdasarkan username, nama lengkap, atau unit kerja..." className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs" /></div></div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"><div className="overflow-x-auto">{filteredUsers.length === 0 ? <div className="p-12 text-center text-xs text-slate-500">Tidak ada pengguna yang sesuai</div> : <table className="w-full text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-600"><tr><th className="px-4 py-3">Username</th><th className="px-4 py-3">Nama Lengkap</th><th className="px-4 py-3">Peran (Role)</th><th className="px-4 py-3">Unit Kerja</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100 text-slate-700">{filteredUsers.map((user) => <tr key={user.id} className="hover:bg-slate-50/80"><td className="px-4 py-3 font-mono font-medium text-slate-900">{user.username}</td><td className="px-4 py-3 font-semibold text-slate-900">{user.name}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-1">{user.roles.map(({ role }) => <span key={role} className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800">{roleDisplayName(role)}</span>)}</div></td><td className="px-4 py-3 text-slate-600">{user.unit?.name ?? <span className="italic text-slate-400">-</span>}</td><td className="px-4 py-3">{user.status === "ACTIVE" ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" aria-hidden="true" />Aktif</span> : <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"><XCircle className="h-3 w-3" aria-hidden="true" />Nonaktif</span>}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => openEdit(user)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] hover:underline"><Edit2 className="h-3.5 w-3.5" aria-hidden="true" />Edit</button></td></tr>)}</tbody></table>}</div></div>
    {createOpen && <UserDialog title="Tambah Akun Pengguna" error={createError}><form onSubmit={handleCreate} className="space-y-3.5"><TextField id="create-username" label="Username" value={username} onChange={setUsername} placeholder="misal: ahmad.fauzi" required /><TextField id="create-name" label="Nama Lengkap" value={name} onChange={setName} placeholder="Nama lengkap beserta gelar jika ada" required /><TextField id="create-password" label="Password (Min 4 Karakter)" value={password} onChange={setPassword} type="password" required /><RoleAndUnit roles={roles} setRoles={setRoles} unitId={unitId} setUnitId={setUnitId} units={units} toggleRole={toggleRole} idPrefix="create" /><DialogActions pending={isPending} onCancel={resetCreateForm} submitLabel="Simpan Pengguna" /></form></UserDialog>}
    {editUser && <UserDialog title={`Ubah Pengguna: ${editUser.username}`} error={editError}><form onSubmit={handleUpdate} className="space-y-3.5"><TextField id="edit-name" label="Nama Lengkap" value={editName} onChange={setEditName} required /><RoleAndUnit roles={editRoles} setRoles={setEditRoles} unitId={editUnitId} setUnitId={setEditUnitId} units={units} toggleRole={toggleRole} idPrefix="edit" status={editStatus} setStatus={setEditStatus} /><TextField id="edit-password" label="Ganti Password (Kosongkan jika tidak diubah)" value={editPassword} onChange={setEditPassword} type="password" placeholder="Min 4 karakter jika ingin mengubah" /><DialogActions pending={isPending} onCancel={resetEditForm} submitLabel="Perbarui Pengguna" /></form></UserDialog>}
  </div>;
}

function UserDialog({ title, error, children }: { title: string; error: string; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="user-dialog-title"><div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><h3 id="user-dialog-title" className="text-base font-bold text-slate-900">{title}</h3>{error && <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{error}</span></div>}{children}</div></div>; }
function TextField({ id, label, value, onChange, type = "text", placeholder, required = false }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: "text" | "password"; placeholder?: string; required?: boolean }) { return <div><label htmlFor={id} className="mb-1 block text-[11px] font-semibold uppercase text-slate-700">{label}</label><input id={id} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs" /></div>; }
function RoleAndUnit({ roles, setRoles, unitId, setUnitId, units, toggleRole, idPrefix, status, setStatus }: { roles: string[]; setRoles: React.Dispatch<React.SetStateAction<string[]>>; unitId: string; setUnitId: (value: string) => void; units: UnitOption[]; toggleRole: (role: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => void; idPrefix: string; status?: "ACTIVE" | "INACTIVE"; setStatus?: (value: "ACTIVE" | "INACTIVE") => void }) { return <><div className="grid grid-cols-2 gap-3"><fieldset><legend className="mb-1 block text-[11px] font-semibold uppercase text-slate-700">Role Akses</legend><div className="space-y-1.5 rounded border border-slate-200 p-2">{availableRoles.map(([role, label]) => <label key={role} className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={roles.includes(role)} onChange={() => toggleRole(role, setRoles)} />{label}</label>)}</div></fieldset>{setStatus ? <div><label htmlFor={`${idPrefix}-status`} className="mb-1 block text-[11px] font-semibold uppercase text-slate-700">Status Akun</label><select id={`${idPrefix}-status`} value={status} onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")} className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"><option value="ACTIVE">Aktif</option><option value="INACTIVE">Nonaktif</option></select></div> : <UnitSelect id={`${idPrefix}-unit`} unitId={unitId} setUnitId={setUnitId} units={units} />}</div>{setStatus && <UnitSelect id={`${idPrefix}-unit`} unitId={unitId} setUnitId={setUnitId} units={units} />}</>; }
function UnitSelect({ id, unitId, setUnitId, units }: { id: string; unitId: string; setUnitId: (value: string) => void; units: UnitOption[] }) { return <div><label htmlFor={id} className="mb-1 block text-[11px] font-semibold uppercase text-slate-700">Unit Kerja</label><select id={id} value={unitId} onChange={(event) => setUnitId(event.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"><option value="">(Tanpa Unit / Terpusat)</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></div>; }
function DialogActions({ pending, onCancel, submitLabel }: { pending: boolean; onCancel: () => void; submitLabel: string }) { return <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={onCancel} disabled={pending} className="rounded px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Batal</button><button type="submit" disabled={pending} className="cursor-pointer rounded bg-[#1E3A5F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#162C47] disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Menyimpan..." : submitLabel}</button></div>; }
