"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  Edit3,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useCurrentUser } from "@/app/(app)/_components/AppShell";
import {
  StatusBadge,
  SubmissionStatus,
  roleDisplayName,
} from "@/components/StatusBadge";
import {
  SubmissionTimeline,
  TimelineAction,
} from "./_components/SubmissionTimeline";
import {
  SubmissionItemsTable,
  SubmissionItem,
} from "./_components/SubmissionItemsTable";
import {
  SubmissionAttachments,
  AttachmentItem,
} from "./_components/SubmissionAttachments";
import {
  SubmissionActionModal,
  ActionModalState,
} from "./_components/SubmissionActionModal";
import { ConsiderationPanel } from "./_components/ConsiderationPanel";
import { ExplanationPanel } from "./_components/ExplanationPanel";

interface SubmissionDetail {
  id: string;
  number: string;
  status: SubmissionStatus;
  createdAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  decidedAt: string | null;
  requesterId: string;
  requester: { id: string; username: string; name: string; roles: Array<{ role: string }> };
  unit: { id: string; name: string };
  category: { id: string; name: string };
  items: SubmissionItem[];
  currentStep?: {
    id: string;
    order: number;
    type: "APPROVAL" | "CONSIDERATION";
    targetType: string;
    targetRole: string | null;
    targetUser?: { id: string; name: string } | null;
  } | null;
  actions: TimelineAction[];
  revisions: Array<{
    id: string;
    snapshot: unknown;
    createdAt: string;
    editedBy: { id: string; name: string };
  }>;
  attachments: AttachmentItem[];
  considerationRequests: Array<{
    id: string;
    requestedBy: { id: string; name: string };
    recipient: { id: string; name: string; roles: Array<{ role: string }> };
    message: string;
    response: string | null;
    status: "PENDING" | "RESPONDED";
    createdAt: string;
    respondedAt: string | null;
  }>;
  explanationRequests: Array<{
    id: string;
    requestedBy: { id: string; name: string };
    recipient: { id: string; name: string };
    question: string;
    answer: string | null;
    status: "PENDING" | "ANSWERED";
    createdAt: string;
    answeredAt: string | null;
  }>;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
}

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const resolvedParams = use(params);
  const submissionId = resolvedParams.submissionId;
  const user = useCurrentUser();
  const router = useRouter();

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<ActionModalState>({
    open: false,
    type: null,
    title: "",
    note: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Revision edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<SubmissionItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      try {
        const data = await api.get<SubmissionDetail>(
          `/api/submissions/${submissionId}`,
        );
        if (!active) return;
        setSubmission(data);
        setEditItems(data.items);
      } catch (err) {
        console.error("Gagal memuat detail pengajuan", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [submissionId]);

  async function handleExecuteAction() {
    if (!actionModal.type || !submission) return;
    setErrorMsg("");

    if (actionModal.type === "DELETE") {
      setActionLoading(true);
      try {
        await api.delete(`/api/submissions/${submission.id}`);
        router.replace("/submissions");
        router.refresh();
      } catch (err) {
        setActionModal({ open: false, type: null, title: "", note: "" });
        if (err instanceof ApiError) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Gagal menghapus pengajuan");
        }
      } finally {
        setActionLoading(false);
      }
      return;
    }

    const requiresNote =
      actionModal.type === "REJECT" ||
      actionModal.type === "REQUEST_REVISION" ||
      actionModal.type === "CONSIDERATION";

    if (requiresNote && !actionModal.note.trim()) {
      setErrorMsg("Catatan wajib diisi untuk tindakan ini");
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/api/submissions/${submission.id}/actions`, {
        action: actionModal.type,
        note: actionModal.note.trim() || undefined,
      });

      const refreshed = await api.get<SubmissionDetail>(
        `/api/submissions/${submission.id}`,
      );
      setSubmission(refreshed);
      setActionModal({ open: false, type: null, title: "", note: "" });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Gagal memproses tindakan");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSubmitDraft() {
    if (!submission) return;
    setActionLoading(true);
    setErrorMsg("");
    try {
      await api.post(`/api/submissions/${submission.id}/submit`);
      const refreshed = await api.get<SubmissionDetail>(
        `/api/submissions/${submission.id}`,
      );
      setSubmission(refreshed);
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function refreshSubmission() {
    const refreshed = await api.get<SubmissionDetail>(`/api/submissions/${submissionId}`);
    setSubmission(refreshed);
  }

  async function handleSaveAndResubmitRevision() {
    if (!submission) return;
    setErrorMsg("");

    for (let i = 0; i < editItems.length; i++) {
      const it = editItems[i];
      if (
        !it.name.trim() ||
        !it.quantity ||
        !Number(it.unitPrice)
      ) {
        setErrorMsg(`Lengkapi data barang ke-${i + 1}`);
        return;
      }
    }

    setActionLoading(true);
    try {
      await api.patch(`/api/submissions/${submission.id}`, {
        items: editItems.map((it) => ({
          name: it.name.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          description: it.description.trim(),
          specification: it.specification.trim(),
        })),
      });

      await api.post(`/api/submissions/${submission.id}/revision`);

      setIsEditing(false);
      const refreshed = await api.get<SubmissionDetail>(
        `/api/submissions/${submission.id}`,
      );
      setSubmission(refreshed);
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Memuat berkas pengajuan...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Berkas pengajuan tidak ditemukan
        </p>
        <Link
          href="/submissions"
          className="inline-block mt-3 text-xs text-[#1E3A5F] underline"
        >
          &larr; Kembali ke Daftar Pengajuan
        </Link>
      </div>
    );
  }

  const isCurrentActor =
    user &&
    submission.currentStep &&
    [
      "WAITING_UNIT_MANAGER",
      "WAITING_CONSIDERATION",
      "WAITING_APPROVAL",
      "WAITING_FINANCE",
    ].includes(submission.status) &&
    (submission.currentStep.targetUser?.id === user.id ||
      (submission.currentStep.targetType === "ROLE" &&
        submission.currentStep.targetRole !== null && user.roles.includes(submission.currentStep.targetRole)) ||
      user.roles.includes("SUPERADMIN"));

  const isRequester = user?.id === submission.requesterId;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/submissions"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                {submission.number}
              </h1>
              <StatusBadge status={submission.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dibuat oleh <strong>{submission.requester.name}</strong> (
              {submission.unit.name}) pada{" "}
              {new Date(submission.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {submission.status === "DRAFT" && isRequester && (
            <button
              type="button"
              onClick={handleSubmitDraft}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-white bg-[#1E3A5F] hover:bg-[#162C47] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {actionLoading ? "Memproses..." : "Kirim Pengajuan Sekarang"}
            </button>
          )}

          {submission.permissions.canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-amber-800" />
                Perbaiki & Kirim Ulang Revisi
              </button>
            )}

          {submission.permissions.canDelete && !isEditing && (
            <button
              type="button"
              onClick={() =>
                setActionModal({
                  open: true,
                  type: "DELETE",
                  title: "Hapus Pengajuan",
                  note: "",
                })
              }
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Hapus Pengajuan
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div
          className="flex items-start gap-2.5 p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-snug">{errorMsg}</span>
        </div>
      )}

      {isCurrentActor && (
        <div className="bg-white p-5 rounded-xl border-2 border-[#1E3A5F] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#1E3A5F] mb-1">
                Tindakan Anda Diperlukan
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                {submission.currentStep?.type === "CONSIDERATION"
                  ? "Tahap Pertimbangan Teknis / Rekomendasi"
                  : "Tahap Keputusan Persetujuan (Approval)"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sebagai {user ? user.roles.map(roleDisplayName).join(", ") : "Approver"},
                berikan keputusan atau masukan Anda terhadap berkas pengadaan
                ini.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {submission.currentStep?.type === "CONSIDERATION" ? (
                <button
                  type="button"
                  onClick={() =>
                    setActionModal({
                      open: true,
                      type: "CONSIDERATION",
                      title: "Beri Catatan Pertimbangan Teknis",
                      note: "",
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Beri Pertimbangan
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActionModal({
                        open: true,
                        type: "APPROVE",
                        title: "Setujui Pengajuan",
                        note: "",
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Setujui
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActionModal({
                        open: true,
                        type: "REQUEST_REVISION",
                        title: "Kembalikan untuk Revisi",
                        note: "",
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    Minta Revisi
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActionModal({
                        open: true,
                        type: "REJECT",
                        title: "Tolak Pengajuan Ini",
                        note: "",
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Informasi Pengadaan
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Kategori Barang
                </span>
                <span className="font-semibold text-slate-800">
                  {submission.category.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Unit Kerja
                </span>
                <span className="font-semibold text-slate-800">
                  {submission.unit.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Pemohon
                </span>
                <span className="font-semibold text-slate-800">
                  {submission.requester.name}
                </span>
              </div>
            </div>

          </div>

          <SubmissionItemsTable
            items={submission.items}
            isEditing={isEditing}
            editItems={editItems}
            actionLoading={actionLoading}
            onStartAdd={() =>
              setEditItems((prev) => [
                ...prev,
                {
                  id: String(Date.now()),
                  name: "",
                  quantity: 1,
                  unitPrice: 0,
                  description: "",
                  specification: "",
                },
              ])
            }
            onRemoveEditItem={(id) =>
              setEditItems((prev) => prev.filter((it) => it.id !== id))
            }
            onEditItemChange={(id, field, value) =>
              setEditItems((prev) =>
                prev.map((it) =>
                  it.id === id ? { ...it, [field]: value } : it,
                ),
              )
            }
            onCancelEdit={() => setIsEditing(false)}
            onSaveRevision={handleSaveAndResubmitRevision}
          />

          <SubmissionAttachments
            submissionId={submission.id}
            attachments={submission.attachments}
          />

          <ConsiderationPanel
            submissionId={submission.id}
            canRequest={Boolean(isCurrentActor)}
            currentUserId={user?.id}
            currentUserRoles={user?.roles ?? []}
            requests={submission.considerationRequests}
            onChanged={refreshSubmission}
          />

          <ExplanationPanel
            submissionId={submission.id}
            canRequest={Boolean(isCurrentActor)}
            currentUserId={user?.id}
            requests={submission.explanationRequests}
            onChanged={refreshSubmission}
          />
        </div>

        <div className="space-y-6">
          <SubmissionTimeline actions={submission.actions} />
        </div>
      </div>

      <SubmissionActionModal
        modalState={actionModal}
        loading={actionLoading}
        onClose={() =>
          setActionModal({ open: false, type: null, title: "", note: "" })
        }
        onNoteChange={(note) => setActionModal((prev) => ({ ...prev, note }))}
        onConfirm={handleExecuteAction}
      />
    </div>
  );
}
