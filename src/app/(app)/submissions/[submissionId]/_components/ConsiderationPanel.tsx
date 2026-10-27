"use client";

import { useState } from "react";
import { MessageSquarePlus, Send, UserRound } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { roleDisplayName } from "@/components/StatusBadge";
import {
  getConsiderationCandidatesAction,
  requestConsiderationAction,
  respondToConsiderationAction,
  type SubmissionActionResult,
} from "../../_lib/actions";

type Candidate = {
  id: string;
  name: string;
  username: string;
  unit: { id: string; name: string } | null;
  roles: Array<{ role: string }>;
};

type Request = {
  id: string;
  requestedBy: { id: string; name: string };
  recipient: { id: string; name: string; roles: Array<{ role: string }> };
  message: string;
  response: string | null;
  status: "PENDING" | "RESPONDED";
  createdAt: string;
  respondedAt: string | null;
};

function unwrap<T>(result: SubmissionActionResult<T>): T {
  if (!result.ok) throw new ApiError(result.message);
  return result.data;
}

export function ConsiderationPanel({ submissionId, canRequest, currentUserId, currentUserRoles, requests, onChanged }: {
  submissionId: string;
  canRequest: boolean;
  currentUserId: string | undefined;
  currentUserRoles: string[];
  requests: Request[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [responseFor, setResponseFor] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openRequest() {
    setError("");
    try {
      const data = unwrap(await getConsiderationCandidatesAction(submissionId)) as Candidate[];
      if (data.length === 0) {
        setError("Belum ada akun lain yang aktif dengan role Pemberi Pertimbangan.");
        return;
      }
      setCandidates(data);
      setRecipientId(data[0]?.id ?? "");
      setOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat daftar pemberi pertimbangan");
    }
  }

  async function submitRequest(e: React.SubmitEvent) {
    e.preventDefault();
    if (!recipientId || !message.trim()) return;
    setLoading(true);
    setError("");
    try {
      await unwrap(await requestConsiderationAction(submissionId, { recipientId, message: message.trim() }));
      await onChanged();
      setOpen(false);
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim permintaan pertimbangan");
    } finally {
      setLoading(false);
    }
  }

  async function submitResponse(e: React.SubmitEvent) {
    e.preventDefault();
    if (!responseFor || !response.trim()) return;
    setLoading(true);
    setError("");
    try {
      await unwrap(await respondToConsiderationAction(submissionId, responseFor, { response: response.trim() }));
      await onChanged();
      setResponseFor(null);
      setResponse("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim pertimbangan");
    } finally {
      setLoading(false);
    }
  }

  const mayRespond = currentUserRoles.includes("CONSIDERATION");
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Permintaan Pertimbangan</h2>
          <p className="mt-1 text-xs text-slate-500">Masukan dapat diminta kepada akun tertentu tanpa mengubah alur approval utama.</p>
        </div>
        {canRequest && <button type="button" onClick={openRequest} className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100"><MessageSquarePlus className="h-4 w-4" />Minta Pertimbangan</button>}
      </div>
      {error && <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800" role="alert">{error}</p>}
      {requests.length === 0 ? <p className="text-xs text-slate-500">Belum ada permintaan pertimbangan.</p> : <div className="space-y-3">{requests.map((request) => {
        const pendingForMe = request.status === "PENDING" && request.recipient.id === currentUserId && mayRespond;
        return <article key={request.id} className="rounded-lg border border-slate-200 p-3 text-xs">
          <div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">{request.recipient.name}</span><span className={request.status === "RESPONDED" ? "text-emerald-700" : "text-amber-700"}>{request.status === "RESPONDED" ? "Sudah ditanggapi" : "Menunggu tanggapan"}</span></div>
          <p className="mt-1 text-slate-500">Diminta oleh {request.requestedBy.name}</p>
          <p className="mt-2 rounded bg-slate-50 p-2 text-slate-700"><span className="font-semibold">Permintaan: </span>{request.message}</p>
          {request.response && <p className="mt-2 rounded bg-emerald-50 p-2 text-emerald-900"><span className="font-semibold">Pertimbangan: </span>{request.response}</p>}
          {pendingForMe && <button type="button" onClick={() => { setResponseFor(request.id); setResponse(""); }} className="mt-2 text-xs font-semibold text-[#1E3A5F] hover:underline">Beri tanggapan</button>}
        </article>;
      })}</div>}
      {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submitRequest} className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><h3 className="text-base font-bold text-slate-900">Minta Pertimbangan</h3><p className="text-xs text-slate-500">Hanya akun dengan role Pemberi Pertimbangan yang ditampilkan.</p><label className="block text-xs font-semibold text-slate-700">Pilih penerima<select value={recipientId} onChange={(event) => setRecipientId(event.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs">{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} — {candidate.roles.map(({ role }) => roleDisplayName(role)).join(", ")}</option>)}</select></label><label className="block text-xs font-semibold text-slate-700">Pesan / hal yang perlu dipertimbangkan<textarea required rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Batal</button><button disabled={loading || !recipientId} className="inline-flex items-center gap-2 rounded bg-[#1E3A5F] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />{loading ? "Mengirim..." : "Kirim Permintaan"}</button></div></form></div>}
      {responseFor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submitResponse} className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-sky-700" /><h3 className="text-base font-bold text-slate-900">Beri Pertimbangan</h3></div><label className="block text-xs font-semibold text-slate-700">Masukan Anda<textarea required rows={5} value={response} onChange={(event) => setResponse(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setResponseFor(null)} className="rounded px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Batal</button><button disabled={loading} className="inline-flex items-center gap-2 rounded bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />{loading ? "Mengirim..." : "Kirim Masukan"}</button></div></form></div>}
    </section>
  );
}
