"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Edit2, Plus, Search, XCircle } from "lucide-react";
import { createCategoryAction, updateCategoryAction } from "../_lib/actions";
import type { AdminCategory } from "../_lib/model";

type CategoriesManagementProps = { categories: AdminCategory[] };

export function CategoriesManagement({ categories }: CategoriesManagementProps) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [editCategory, setEditCategory] = useState<AdminCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editError, setEditError] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetCreateForm() {
    setCreateOpen(false); setCreateName(""); setCreateError("");
  }

  function resetEditForm() {
    setEditCategory(null); setEditName(""); setEditStatus("ACTIVE"); setEditError("");
  }

  useLayoutEffect(() => () => { resetCreateForm(); resetEditForm(); }, []);

  function openEdit(category: AdminCategory) {
    setEditCategory(category); setEditName(category.name); setEditStatus(category.status); setEditError("");
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCreateError("");
    startTransition(async () => {
      const result = await createCategoryAction({ name: createName });
      if (result.ok) resetCreateForm(); else setCreateError(result.message);
    });
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editCategory) return; setEditError("");
    startTransition(async () => {
      const result = await updateCategoryAction(editCategory.id, { name: editName, status: editStatus });
      if (result.ok) resetEditForm(); else setEditError(result.message);
    });
  }

  const filteredCategories = categories.filter((category) => category.name.toLowerCase().includes(search.toLowerCase()));

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-bold tracking-tight text-slate-900">Manajemen Kategori Barang</h1><p className="mt-0.5 text-xs text-slate-500">Kelola kategori pengadaan yang tersedia saat membuat pengajuan.</p></div><button type="button" onClick={() => { resetCreateForm(); setCreateOpen(true); }} className="inline-flex self-start cursor-pointer items-center gap-2 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#162C47] sm:self-auto"><Plus className="h-4 w-4" aria-hidden="true" />Tambah Kategori Baru</button></div>
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" /><label className="sr-only" htmlFor="category-search">Cari kategori barang</label><input id="category-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama kategori barang..." className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs" /></div></div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"><div className="overflow-x-auto">{filteredCategories.length === 0 ? <div className="p-12 text-center text-xs text-slate-500">Tidak ada kategori yang cocok</div> : <table className="w-full text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-600"><tr><th className="px-4 py-3">Nama Kategori</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100 text-slate-700">{filteredCategories.map((category) => <tr key={category.id} className="hover:bg-slate-50/80"><td className="px-4 py-3 font-semibold text-slate-900">{category.name}</td><td className="px-4 py-3"><StatusBadge status={category.status} /></td><td className="px-4 py-3 text-right"><button type="button" onClick={() => openEdit(category)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] hover:underline"><Edit2 className="h-3.5 w-3.5" aria-hidden="true" />Edit</button></td></tr>)}</tbody></table>}</div></div>
    {createOpen && <CategoryDialog title="Tambah Kategori Barang" error={createError}><form onSubmit={handleCreate} className="space-y-3.5"><TextField id="create-category-name" label="Nama Kategori" value={createName} onChange={setCreateName} placeholder="Contoh: Perangkat TI, Alat Tulis Kantor..." required /><DialogActions pending={isPending} onCancel={resetCreateForm} submitLabel="Simpan Kategori" /></form></CategoryDialog>}
    {editCategory && <CategoryDialog title="Ubah Kategori Barang" error={editError}><form onSubmit={handleUpdate} className="space-y-3.5"><TextField id="edit-category-name" label="Nama Kategori" value={editName} onChange={setEditName} required /><div><label htmlFor="edit-category-status" className="mb-1 block text-[11px] font-semibold uppercase text-slate-700">Status Kategori</label><select id="edit-category-status" value={editStatus} onChange={(event) => setEditStatus(event.target.value as "ACTIVE" | "INACTIVE")} className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"><option value="ACTIVE">Aktif</option><option value="INACTIVE">Nonaktif</option></select></div><DialogActions pending={isPending} onCancel={resetEditForm} submitLabel="Perbarui Kategori" /></form></CategoryDialog>}
  </div>;
}

function StatusBadge({ status }: { status: "ACTIVE" | "INACTIVE" }) {
  if (status === "ACTIVE") return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" aria-hidden="true" />Aktif</span>;
  return <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"><XCircle className="h-3 w-3" aria-hidden="true" />Nonaktif</span>;
}

function CategoryDialog({ title, error, children }: { title: string; error: string; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="category-dialog-title"><div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><h3 id="category-dialog-title" className="text-base font-bold text-slate-900">{title}</h3>{error && <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{error}</span></div>}{children}</div></div>;
}

function TextField({ id, label, value, onChange, placeholder, required = false }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return <div><label htmlFor={id} className="mb-1 block text-[11px] font-semibold uppercase text-slate-700">{label}</label><input id={id} type="text" required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs" /></div>;
}

function DialogActions({ pending, onCancel, submitLabel }: { pending: boolean; onCancel: () => void; submitLabel: string }) {
  return <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={onCancel} disabled={pending} className="rounded px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Batal</button><button type="submit" disabled={pending} className="cursor-pointer rounded bg-[#1E3A5F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#162C47] disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Menyimpan..." : submitLabel}</button></div>;
}
