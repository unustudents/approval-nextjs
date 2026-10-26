"use client";

import { useState } from "react";
import { CircleHelp, Send } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";

type ExplanationRequest = {
  id: string;
  requestedBy: { id: string; name: string };
  recipient: { id: string; name: string };
  question: string;
  answer: string | null;
  status: "PENDING" | "ANSWERED";
  createdAt: string;
  answeredAt: string | null;
};

export function ExplanationPanel({ submissionId, canRequest, currentUserId, requests, onChanged }: {
  submissionId: string;
  canRequest: boolean;
  currentUserId: string | undefined;
  requests: ExplanationRequest[];
  onChanged: () => Promise<void>;
}) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [answerFor, setAnswerFor] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitRequest(event: React.SubmitEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    setLoading(true); setError("");
    try {
      await api.post(`/api/submissions/${submissionId}/explanations`, { question: text.trim() });
      await onChanged(); setRequestOpen(false); setText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim permintaan penjelasan");
    } finally { setLoading(false); }
  }

  async function submitAnswer(event: React.SubmitEvent) {
    event.preventDefault();
    if (!answerFor || !text.trim()) return;
    setLoading(true); setError("");
    try {
      await api.post(`/api/submissions/${submissionId}/explanations/${answerFor}/answer`, { answer: text.trim() });
      await onChanged(); setAnswerFor(null); setText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim penjelasan");
    } finally { setLoading(false); }
  }

  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Penjelasan Pengaju</h2><p className="mt-1 text-xs text-slate-500">Tanya jawab untuk pengaju tanpa meminta revisi pengajuan.</p></div>{canRequest && <button type="button" onClick={() => { setText(""); setRequestOpen(true); }} className="inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"><CircleHelp className="h-4 w-4" />Minta Penjelasan</button>}</div>
    {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">{error}</p>}
    {requests.length === 0 ? <p className="text-xs text-slate-500">Belum ada permintaan penjelasan.</p> : <div className="space-y-3">{requests.map((request) => { const pendingForMe = request.status === "PENDING" && request.recipient.id === currentUserId; return <article key={request.id} className="rounded-lg border border-slate-200 p-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">Kepada {request.recipient.name}</span><span className={request.status === "ANSWERED" ? "text-emerald-700" : "text-amber-700"}>{request.status === "ANSWERED" ? "Sudah dijawab" : "Menunggu penjelasan"}</span></div><p className="mt-1 text-slate-500">Ditanyakan oleh {request.requestedBy.name}</p><p className="mt-2 rounded bg-slate-50 p-2 text-slate-700"><span className="font-semibold">Pertanyaan: </span>{request.question}</p>{request.answer && <p className="mt-2 rounded bg-emerald-50 p-2 text-emerald-900"><span className="font-semibold">Penjelasan: </span>{request.answer}</p>}{pendingForMe && <button type="button" onClick={() => { setText(""); setAnswerFor(request.id); }} className="mt-3 inline-flex items-center gap-2 rounded-md bg-indigo-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"><Send className="h-3.5 w-3.5" aria-hidden="true" />Berikan Penjelasan</button>}</article>; })}</div>}
    {requestOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submitRequest} className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><h3 className="text-base font-bold text-slate-900">Minta Penjelasan kepada Pengaju</h3><p className="text-xs text-slate-500">Permintaan akan dikirim langsung kepada pengaju dan tidak mengubah status pengajuan.</p><label className="block text-xs font-semibold text-slate-700">Hal yang perlu dijelaskan<textarea required rows={5} value={text} onChange={(event) => setText(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setRequestOpen(false)} className="rounded px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Batal</button><button disabled={loading} className="inline-flex items-center gap-2 rounded bg-[#1E3A5F] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />{loading ? "Mengirim..." : "Kirim Permintaan"}</button></div></form></div>}
    {answerFor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form onSubmit={submitAnswer} className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xl"><h3 className="text-base font-bold text-slate-900">Berikan Penjelasan</h3><label className="block text-xs font-semibold text-slate-700">Penjelasan Anda<textarea required rows={5} value={text} onChange={(event) => setText(event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setAnswerFor(null)} className="rounded px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Batal</button><button disabled={loading} className="inline-flex items-center gap-2 rounded bg-indigo-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />{loading ? "Mengirim..." : "Kirim Penjelasan"}</button></div></form></div>}
  </section>;
}
