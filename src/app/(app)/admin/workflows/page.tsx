"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { roleDisplayName } from "@/components/StatusBadge";

interface WorkflowStepItem {
  id?: string;
  type: "APPROVAL" | "CONSIDERATION";
  targetType: "UNIT_MANAGER" | "ROLE" | "USER";
  targetRole?: string | null;
  targetUserId?: string | null;
  required: boolean;
  allowRevision: boolean;
}

interface CategoryWithWorkflow {
  id: string;
  name: string;
  status: string;
  workflow: {
    id: string;
    name: string;
    status: string;
    steps: Array<{
      id: string;
      order: number;
      type: "APPROVAL" | "CONSIDERATION";
      targetType: "UNIT_MANAGER" | "ROLE" | "USER";
      targetRole: string | null;
      targetUser: { id: string; name: string } | null;
      required: boolean;
      allowRevision: boolean;
    }>;
  } | null;
}

interface UserCandidate {
  id: string;
  name: string;
  username: string;
  role: string;
  status: string;
}

function AdminWorkflowsContent() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("categoryId");

  const [categories, setCategories] = useState<CategoryWithWorkflow[]>([]);
  const [users, setUsers] = useState<UserCandidate[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [workflowName, setWorkflowName] = useState("");
  const [steps, setSteps] = useState<WorkflowStepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const [catList, userList] = await Promise.all([
          api.get<CategoryWithWorkflow[]>("/api/admin/workflows"),
          api.get<UserCandidate[]>("/api/admin/users"),
        ]);
        setCategories(catList);
        setUsers(userList.filter((u) => u.status === "ACTIVE"));

        const targetCatId =
          initialCategoryParam &&
          catList.some((c) => c.id === initialCategoryParam)
            ? initialCategoryParam
            : catList[0]?.id;

        if (targetCatId) {
          selectCategory(targetCatId, catList);
        }
      } catch (err) {
        console.error("Gagal inisialisasi workflow", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [initialCategoryParam]);

  function selectCategory(catId: string, list = categories) {
    setSelectedCategoryId(catId);
    setSuccessMsg("");
    setErrorMsg("");

    const found = list.find((c) => c.id === catId);
    if (!found) return;

    if (found.workflow && found.workflow.steps.length > 0) {
      setWorkflowName(found.workflow.name);
      setSteps(
        found.workflow.steps.map((s) => ({
          type: s.type,
          targetType: s.targetType,
          targetRole: s.targetRole,
          targetUserId: s.targetUser?.id ?? null,
          required: s.required,
          allowRevision: s.allowRevision,
        })),
      );
    } else {
      setWorkflowName(`Workflow ${found.name}`);
      setSteps([
        {
          type: "APPROVAL",
          targetType: "UNIT_MANAGER",
          required: true,
          allowRevision: true,
        },
        {
          type: "APPROVAL",
          targetType: "ROLE",
          targetRole: "FINANCE_APPROVER",
          required: true,
          allowRevision: true,
        },
      ]);
    }
  }

  function handleAddStep(type: "APPROVAL" | "CONSIDERATION") {
    setSteps((prev) => [
      ...prev,
      {
        type,
        targetType: "ROLE",
        targetRole:
          type === "CONSIDERATION" ? "CONSIDERATION" : "FINANCE_APPROVER",
        required: true,
        allowRevision: type === "APPROVAL",
      },
    ]);
  }

  function handleRemoveStep(index: number) {
    if (index === 0) return; // Step 1 is mandatory Manager Unit
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleMoveStep(index: number, direction: "up" | "down") {
    if (index === 0) return; // Cannot move step 1
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx <= 0 || newIdx >= steps.length) return;

    setSteps((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[newIdx];
      copy[newIdx] = temp;
      return copy;
    });
  }

  function handleStepChange<K extends keyof WorkflowStepItem>(
    index: number,
    field: K,
    val: WorkflowStepItem[K],
  ) {
    setSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== index) return step;
        const updated = { ...step, [field]: val };
        if (field === "type" && val === "CONSIDERATION") {
          updated.allowRevision = false;
        }
        return updated;
      }),
    );
  }

  async function handleSaveWorkflow() {
    setSuccessMsg("");
    setErrorMsg("");

    if (!workflowName.trim()) {
      setErrorMsg("Nama workflow wajib diisi");
      return;
    }
    if (steps.length < 2) {
      setErrorMsg("Workflow minimal harus memiliki 2 tahapan");
      return;
    }
    if (steps[steps.length - 1].type !== "APPROVAL") {
      setErrorMsg("Tahap terakhir workflow harus berupa APPROVAL");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/admin/workflows/${selectedCategoryId}`, {
        name: workflowName.trim(),
        steps: steps.map((s) => ({
          type: s.type,
          targetType: s.targetType,
          targetRole: s.targetType === "ROLE" ? s.targetRole : null,
          targetUserId: s.targetType === "USER" ? s.targetUserId : null,
          required: s.required,
          allowRevision: s.allowRevision,
        })),
      });

      const updated = await api.get<CategoryWithWorkflow[]>(
        "/api/admin/workflows",
      );
      setCategories(updated);
      setSuccessMsg("Konfigurasi workflow berhasil disimpan!");
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message);
      else setErrorMsg("Gagal menyimpan konfigurasi workflow");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Konfigurasi Workflow Persetujuan Dinamis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur urutan tahapan approval dan pemberi pertimbangan per kategori
            tanpa mengubah kode aplikasi (FR-011, FR-012).
          </p>
        </div>

        <button
          type="button"
          disabled={saving || !selectedCategoryId}
          onClick={handleSaveWorkflow}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] shadow-xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Simpan Workflow"}
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Pilih Kategori Barang
          </h2>
          <div className="space-y-1">
            {categories.map((c) => {
              const active = c.id === selectedCategoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCategory(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-between ${
                    active
                      ? "bg-[#1E3A5F] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {c.workflow?.steps.length ?? 2} tahap
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                Nama Workflow untuk Kategori &ldquo;{selectedCategory?.name}
                &rdquo;
              </label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white font-medium"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Urutan Tahapan Workflow
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddStep("CONSIDERATION")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded"
                >
                  <Plus className="w-3.5 h-3.5" />+ Tahap Pertimbangan
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep("APPROVAL")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#1E3A5F] bg-slate-100 hover:bg-slate-200 rounded"
                >
                  <Plus className="w-3.5 h-3.5" />+ Tahap Approval
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === steps.length - 1;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border text-xs transition-colors ${
                      step.type === "CONSIDERATION"
                        ? "bg-sky-50/40 border-sky-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#1E3A5F] text-white font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">
                          {isFirst
                            ? "Tahap 1 — Approval Manager Unit (Wajib)"
                            : step.type === "CONSIDERATION"
                              ? `Tahap ${idx + 1} — Pertimbangan Teknis (Review)`
                              : `Tahap ${idx + 1} — Persetujuan (Approval)`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isFirst && idx > 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, "up")}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title="Pindahkan ke atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isFirst && idx < steps.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, "down")}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title="Pindahkan ke bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isFirst && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 ml-1"
                            title="Hapus tahapan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isFirst ? (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
                        Sesuai PRD FR-009, setiap pengajuan pertama kali
                        otomatis diarahkan ke Manager yang membawahi unit kerja
                        pemohon.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                            Tipe Tahap
                          </label>
                          <select
                            value={step.type}
                            onChange={(e) =>
                              handleStepChange(
                                idx,
                                "type",
                                e.target.value as "APPROVAL" | "CONSIDERATION",
                              )
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                          >
                            <option value="APPROVAL">
                              Approval (Keputusan)
                            </option>
                            <option value="CONSIDERATION">
                              Pertimbangan (Catatan Masukan)
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                            Target Penugasan
                          </label>
                          <select
                            value={step.targetType}
                            onChange={(e) =>
                              handleStepChange(
                                idx,
                                "targetType",
                                e.target.value as "ROLE" | "USER",
                              )
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                          >
                            <option value="ROLE">
                              Berdasarkan Peran (Role)
                            </option>
                            <option value="USER">Pengguna Tertentu</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                            {step.targetType === "ROLE"
                              ? "Pilih Role"
                              : "Pilih Pengguna"}
                          </label>
                          {step.targetType === "ROLE" ? (
                            <select
                              value={step.targetRole ?? ""}
                              onChange={(e) =>
                                handleStepChange(
                                  idx,
                                  "targetRole",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                            >
                              <option value="CONSIDERATION">
                                Pemberi Pertimbangan
                              </option>
                              <option value="FINANCE_APPROVER">
                                Approver Keuangan
                              </option>
                              <option value="SUPERADMIN">Superadmin</option>
                            </select>
                          ) : (
                            <select
                              value={step.targetUserId ?? ""}
                              onChange={(e) =>
                                handleStepChange(
                                  idx,
                                  "targetUserId",
                                  e.target.value || null,
                                )
                              }
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                            >
                              <option value="">(Pilih pengguna)</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({roleDisplayName(u.role)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    )}

                    {!isFirst && (
                      <div className="mt-3 flex items-center gap-4 pt-2 border-t border-slate-100">
                        {step.type === "APPROVAL" && (
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={step.allowRevision}
                              onChange={(e) =>
                                handleStepChange(
                                  idx,
                                  "allowRevision",
                                  e.target.checked,
                                )
                              }
                              className="rounded text-[#1E3A5F]"
                            />
                            Izinkan approver meminta revisi ke pemohon
                          </label>
                        )}
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={step.required}
                            onChange={(e) =>
                              handleStepChange(
                                idx,
                                "required",
                                e.target.checked,
                              )
                            }
                            className="rounded text-[#1E3A5F]"
                          />
                          Tahap wajib diselesaikan
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminWorkflowsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-500">
          Memuat konfigurasi workflow...
        </div>
      }
    >
      <AdminWorkflowsContent />
    </Suspense>
  );
}
