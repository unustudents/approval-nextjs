"use client";

import { useState, useTransition } from "react";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import { roleDisplayName } from "@/components/StatusBadge";
import { replaceWorkflowAction } from "../_lib/actions";
import type { WorkflowCategory, WorkflowStepItem, WorkflowUser } from "../_lib/model";

type WorkflowsManagementProps = {
  categories: WorkflowCategory[];
  users: WorkflowUser[];
  initialCategoryId?: string;
};

function workflowDraft(category: WorkflowCategory | undefined): { name: string; steps: WorkflowStepItem[] } {
  if (!category) return { name: "", steps: [] as WorkflowStepItem[] };
  if (category.workflow?.steps.length) {
    return {
      name: category.workflow.name,
      steps: category.workflow.steps.map((step) => ({
        type: step.type,
        targetType: step.targetType,
        targetRole: step.targetRole,
        targetUserId: step.targetUser?.id ?? null,
        required: step.required,
        allowRevision: step.allowRevision,
      })),
    };
  }
  return {
    name: `Workflow ${category.name}`,
    steps: [
      { type: "APPROVAL", targetType: "UNIT_MANAGER", required: true, allowRevision: true },
      { type: "APPROVAL", targetType: "ROLE", targetRole: "FINANCE_APPROVER", required: true, allowRevision: true },
    ],
  };
}

export function WorkflowsManagement({ categories, users, initialCategoryId }: WorkflowsManagementProps) {
  const initialCategory = categories.find((category) => category.id === initialCategoryId) ?? categories[0];
  const initialDraft = workflowDraft(initialCategory);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategory?.id ?? "");
  const [workflowName, setWorkflowName] = useState(initialDraft.name);
  const [steps, setSteps] = useState<WorkflowStepItem[]>(initialDraft.steps);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

  function selectCategory(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId);
    const draft = workflowDraft(category);
    setSelectedCategoryId(categoryId);
    setWorkflowName(draft.name);
    setSteps(draft.steps);
    setSuccessMessage("");
    setErrorMessage("");
  }

  function addStep(type: "APPROVAL" | "CONSIDERATION") {
    setSteps((current) => [...current, {
      type,
      targetType: "ROLE",
      targetRole: type === "CONSIDERATION" ? "CONSIDERATION" : "FINANCE_APPROVER",
      required: true,
      allowRevision: type === "APPROVAL",
    }]);
  }

  function removeStep(index: number) {
    if (index === 0) return;
    setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveStep(index: number, direction: "up" | "down") {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (index === 0 || nextIndex <= 0 || nextIndex >= steps.length) return;
    setSteps((current) => {
      const reordered = [...current];
      [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
      return reordered;
    });
  }

  function updateStep(index: number, update: Partial<WorkflowStepItem>) {
    setSteps((current) => current.map((step, itemIndex) => {
      if (itemIndex !== index) return step;
      const nextStep = { ...step, ...update };
      if (nextStep.type === "CONSIDERATION") nextStep.allowRevision = false;
      return nextStep;
    }));
  }

  function saveWorkflow() {
    setSuccessMessage("");
    setErrorMessage("");
    if (!selectedCategoryId) return;
    if (!workflowName.trim()) {
      setErrorMessage("Nama workflow wajib diisi");
      return;
    }
    if (steps.length < 2) {
      setErrorMessage("Workflow minimal harus memiliki 2 tahapan");
      return;
    }
    if (steps.at(-1)?.type !== "APPROVAL") {
      setErrorMessage("Tahap terakhir workflow harus berupa approval");
      return;
    }

    startTransition(async () => {
      const result = await replaceWorkflowAction(selectedCategoryId, {
        name: workflowName.trim(),
        steps: steps.map((step) => ({
          ...step,
          targetRole: step.targetType === "ROLE" ? step.targetRole ?? null : null,
          targetUserId: step.targetType === "USER" ? step.targetUserId ?? null : null,
        })),
      });
      if (result.ok) setSuccessMessage("Konfigurasi workflow berhasil disimpan.");
      else setErrorMessage(result.message);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Konfigurasi Workflow Persetujuan Dinamis</h1>
          <p className="mt-0.5 text-xs text-slate-500">Atur urutan tahapan approval dan pemberi pertimbangan per kategori tanpa mengubah kode aplikasi (FR-011, FR-012).</p>
        </div>
        <button type="button" disabled={isPending || !selectedCategoryId} onClick={saveWorkflow} className="inline-flex self-start cursor-pointer items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#162C47] disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto">
          <Save className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Menyimpan..." : "Simpan Workflow"}
        </button>
      </div>

      {successMessage && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />{successMessage}</div>}
      {errorMessage && <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"><AlertCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />{errorMessage}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs" aria-label="Pilih kategori barang">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Pilih Kategori Barang</h2>
          <div className="space-y-1">
            {categories.map((category) => {
              const active = category.id === selectedCategoryId;
              return <button key={category.id} type="button" onClick={() => selectCategory(category.id)} aria-pressed={active} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] ${active ? "bg-[#1E3A5F] text-white" : "text-slate-700 hover:bg-slate-100"}`}><span className="truncate">{category.name}</span><span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>{category.workflow?.steps.length ?? 2} tahap</span></button>;
            })}
          </div>
        </aside>

        <div className="space-y-4 md:col-span-3">
          {selectedCategory ? <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div>
              <label htmlFor="workflow-name" className="mb-1 block text-[11px] font-semibold uppercase text-slate-700">Nama Workflow untuk Kategori &ldquo;{selectedCategory.name}&rdquo;</label>
              <input id="workflow-name" type="text" value={workflowName} onChange={(event) => setWorkflowName(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium" />
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Urutan Tahapan Workflow</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => addStep("CONSIDERATION")} className="inline-flex cursor-pointer items-center gap-1 rounded border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"><Plus className="h-3.5 w-3.5" aria-hidden="true" />Tahap Pertimbangan</button>
                <button type="button" onClick={() => addStep("APPROVAL")} className="inline-flex cursor-pointer items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-[#1E3A5F] hover:bg-slate-200"><Plus className="h-3.5 w-3.5" aria-hidden="true" />Tahap Approval</button>
              </div>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => <WorkflowStepCard key={`${step.type}-${index}`} step={step} index={index} totalSteps={steps.length} users={users} onChange={(update) => updateStep(index, update)} onMove={moveStep} onRemove={removeStep} />)}
            </div>
          </div> : <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">Belum ada kategori barang yang dapat dikonfigurasi.</div>}
        </div>
      </div>
    </div>
  );
}

function WorkflowStepCard({ step, index, totalSteps, users, onChange, onMove, onRemove }: { step: WorkflowStepItem; index: number; totalSteps: number; users: WorkflowUser[]; onChange: (update: Partial<WorkflowStepItem>) => void; onMove: (index: number, direction: "up" | "down") => void; onRemove: (index: number) => void }) {
  const isFirst = index === 0;
  return <div className={`rounded-lg border p-4 text-xs transition-colors ${step.type === "CONSIDERATION" ? "border-sky-200 bg-sky-50/40" : "border-slate-200 bg-white"}`}>
    <div className="mb-3 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F] text-xs font-bold text-white">{index + 1}</span><span className="truncate font-bold text-slate-900">{isFirst ? "Tahap 1 — Approval Manager Unit (Wajib)" : step.type === "CONSIDERATION" ? `Tahap ${index + 1} — Pertimbangan Teknis (Review)` : `Tahap ${index + 1} — Persetujuan (Approval)`}</span></div>{!isFirst && <div className="flex shrink-0 items-center gap-1"><IconButton label="Pindahkan tahap ke atas" disabled={index <= 1} onClick={() => onMove(index, "up")}><ArrowUp className="h-3.5 w-3.5" /></IconButton><IconButton label="Pindahkan tahap ke bawah" disabled={index === totalSteps - 1} onClick={() => onMove(index, "down")}><ArrowDown className="h-3.5 w-3.5" /></IconButton><IconButton label="Hapus tahapan" danger onClick={() => onRemove(index)}><Trash2 className="h-3.5 w-3.5" /></IconButton></div>}</div>
    {isFirst ? <p className="rounded border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-500">Sesuai PRD FR-009, setiap pengajuan pertama kali otomatis diarahkan ke Manager yang membawahi unit kerja pemohon.</p> : <><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><SelectField id={`step-${index}-type`} label="Tipe Tahap" value={step.type} onChange={(value) => onChange({ type: value as WorkflowStepItem["type"] })}><option value="APPROVAL">Approval (Keputusan)</option><option value="CONSIDERATION">Pertimbangan (Catatan Masukan)</option></SelectField><SelectField id={`step-${index}-target`} label="Target Penugasan" value={step.targetType} onChange={(value) => onChange({ targetType: value as "ROLE" | "USER" })}><option value="ROLE">Berdasarkan Peran (Role)</option><option value="USER">Pengguna Tertentu</option></SelectField>{step.targetType === "ROLE" ? <SelectField id={`step-${index}-role`} label="Pilih Role" value={step.targetRole ?? ""} onChange={(value) => onChange({ targetRole: value as WorkflowStepItem["targetRole"] })}><option value="CONSIDERATION">Pemberi Pertimbangan</option><option value="FINANCE_APPROVER">Approver Keuangan</option><option value="SUPERADMIN">Superadmin</option></SelectField> : <SelectField id={`step-${index}-user`} label="Pilih Pengguna" value={step.targetUserId ?? ""} onChange={(value) => onChange({ targetUserId: value || null })}><option value="">(Pilih pengguna)</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.roles.map(({ role }) => roleDisplayName(role)).join(", ")})</option>)}</SelectField>}</div><div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-2 sm:flex-row sm:gap-4">{step.type === "APPROVAL" && <Checkbox label="Izinkan approver meminta revisi ke pemohon" checked={step.allowRevision} onChange={(allowRevision) => onChange({ allowRevision })} />}<Checkbox label="Tahap wajib diselesaikan" checked={step.required} onChange={(required) => onChange({ required })} /></div></>}
  </div>;
}

function SelectField({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <div><label htmlFor={id} className="mb-1 block text-[10px] font-semibold uppercase text-slate-600">{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs">{children}</select></div>; }
function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="rounded text-[#1E3A5F]" />{label}</label>; }
function IconButton({ label, disabled = false, danger = false, onClick, children }: { label: string; disabled?: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={`rounded p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${danger ? "text-slate-400 hover:text-rose-600" : "text-slate-400 hover:text-slate-700"}`}>{children}</button>; }
