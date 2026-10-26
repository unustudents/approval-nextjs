"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Edit2, Plus, Search, Users, XCircle } from "lucide-react";
import { createUnitAction, updateUnitAction } from "../_lib/actions";
import type { AdminUnit, ManagerCandidate } from "../_lib/model";

type UnitsManagementProps = {
  units: AdminUnit[];
  managers: ManagerCandidate[];
};

export function UnitsManagement({ units, managers }: UnitsManagementProps) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createManagerId, setCreateManagerId] = useState("");
  const [createError, setCreateError] = useState("");
  const [editUnit, setEditUnit] = useState<AdminUnit | null>(null);
  const [editName, setEditName] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editError, setEditError] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetCreateForm() {
    setCreateOpen(false);
    setCreateName("");
    setCreateManagerId("");
    setCreateError("");
  }

  function resetEditForm() {
    setEditUnit(null);
    setEditName("");
    setEditManagerId("");
    setEditStatus("ACTIVE");
    setEditError("");
  }

  useLayoutEffect(() => () => {
    resetCreateForm();
    resetEditForm();
  }, []);

  function openEdit(unit: AdminUnit) {
    setEditUnit(unit);
    setEditName(unit.name);
    setEditManagerId(unit.manager?.id ?? "");
    setEditStatus(unit.status);
    setEditError("");
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");

    startTransition(async () => {
      const result = await createUnitAction({ name: createName, managerId: createManagerId || null });
      if (result.ok) resetCreateForm();
      else setCreateError(result.message);
    });
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editUnit) return;
    setEditError("");

    startTransition(async () => {
      const result = await updateUnitAction(editUnit.id, {
        name: editName,
        managerId: editManagerId || null,
        status: editStatus,
      });
      if (result.ok) resetEditForm();
      else setEditError(result.message);
    });
  }

  const filteredUnits = units.filter((unit) => {
    const query = search.toLowerCase();
    return unit.name.toLowerCase().includes(query) || (unit.manager?.name ?? "").toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Manajemen Unit Kerja</h1>
          <p className="mt-0.5 text-xs text-slate-500">Kelola departemen/unit kantor dan tetapkan Manager Unit yang membawahi persetujuan pertama.</p>
        </div>
        <button type="button" onClick={() => { resetCreateForm(); setCreateOpen(true); }} className="inline-flex self-start cursor-pointer items-center gap-2 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#162C47] sm:self-auto">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah Unit Baru
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <label className="sr-only" htmlFor="unit-search">Cari unit kerja</label>
          <input id="unit-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari unit kerja atau nama manager..." className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          {filteredUnits.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">Tidak ada unit kerja yang sesuai</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Nama Unit Kerja</th>
                  <th className="px-4 py-3">Manager Unit Penanggung Jawab</th>
                  <th className="px-4 py-3 text-center">Jumlah Anggota</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-900">{unit.name}</td>
                    <td className="px-4 py-3">
                      {unit.manager?.name ? <span className="font-medium text-slate-800">{unit.manager.name}</span> : <span className="italic text-amber-600">Belum ditentukan</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                        <Users className="h-3 w-3 text-slate-500" aria-hidden="true" />
                        {unit._count.members}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {unit.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" aria-hidden="true" />Aktif</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"><XCircle className="h-3 w-3" aria-hidden="true" />Nonaktif</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => openEdit(unit)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] hover:underline">
                        <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
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
        <UnitDialog title="Tambah Unit Kerja Baru" error={createError}>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <TextField id="create-unit-name" label="Nama Unit Kerja" value={createName} onChange={setCreateName} placeholder="Contoh: Unit TI & Komunikasi, Unit Logistik..." required />
            <ManagerSelect id="create-unit-manager" managerId={createManagerId} onChange={setCreateManagerId} managers={managers} showHelp />
            <DialogActions pending={isPending} onCancel={resetCreateForm} submitLabel="Simpan Unit" />
          </form>
        </UnitDialog>
      )}

      {editUnit && (
        <UnitDialog title="Ubah Unit Kerja" error={editError}>
          <form onSubmit={handleUpdate} className="space-y-3.5">
            <TextField id="edit-unit-name" label="Nama Unit Kerja" value={editName} onChange={setEditName} required />
            <ManagerSelect id="edit-unit-manager" managerId={editManagerId} onChange={setEditManagerId} managers={managers} />
            <StatusSelect status={editStatus} onChange={setEditStatus} memberCount={editUnit._count.members} />
            <DialogActions pending={isPending} onCancel={resetEditForm} submitLabel="Perbarui Unit" />
          </form>
        </UnitDialog>
      )}
    </div>
  );
}

function UnitDialog({ title, error, children }: { title: string; error: string; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="unit-dialog-title"><div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><h3 id="unit-dialog-title" className="text-base font-bold text-slate-900">{title}</h3>{error && <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{error}</span></div>}{children}</div></div>;
}

function TextField({ id, label, value, onChange, placeholder, required = false }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return <div><label htmlFor={id} className="mb-1 block text-[11px] font-semibold uppercase text-slate-700">{label} {required && <span className="text-rose-500">*</span>}</label><input id={id} type="text" required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs" /></div>;
}

function ManagerSelect({ id, managerId, onChange, managers, showHelp = false }: { id: string; managerId: string; onChange: (value: string) => void; managers: ManagerCandidate[]; showHelp?: boolean }) {
  return <div><label htmlFor={id} className="mb-1 block text-[11px] font-semibold uppercase text-slate-700">Manager Unit Penanggung Jawab</label><select id={id} value={managerId} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"><option value="">(Belum ditentukan)</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}</select>{showHelp && <p className="mt-1 text-[10px] text-slate-400">Hanya pengguna aktif dengan role Manager Unit yang dapat dipilih.</p>}</div>;
}

function StatusSelect({ status, onChange, memberCount }: { status: "ACTIVE" | "INACTIVE"; onChange: (value: "ACTIVE" | "INACTIVE") => void; memberCount: number }) {
  return <div><label htmlFor="edit-unit-status" className="mb-1 block text-[11px] font-semibold uppercase text-slate-700">Status Unit</label><select id="edit-unit-status" value={status} onChange={(event) => onChange(event.target.value as "ACTIVE" | "INACTIVE")} className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"><option value="ACTIVE">Aktif</option><option value="INACTIVE">Nonaktif</option></select>{memberCount > 0 && status === "INACTIVE" && <p className="mt-1 text-[10px] text-rose-500">Perhatian: Unit masih memiliki {memberCount} anggota. Pindahkan anggota sebelum menonaktifkan.</p>}</div>;
}

function DialogActions({ pending, onCancel, submitLabel }: { pending: boolean; onCancel: () => void; submitLabel: string }) {
  return <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={onCancel} disabled={pending} className="rounded px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Batal</button><button type="submit" disabled={pending} className="cursor-pointer rounded bg-[#1E3A5F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#162C47] disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Menyimpan..." : submitLabel}</button></div>;
}
