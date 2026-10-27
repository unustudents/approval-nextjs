"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, KeyRound, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateOwnProfileAction } from "../_lib/actions";

type ProfileSettingsProps = {
  user: { username: string; name: string };
};

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter();
  const [username, setUsername] = useState(user.username);
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak sama");
      return;
    }

    setPasswordError("");
    setCurrentPassword("");
    setPasswordDialogOpen(true);
  }

  function handleConfirmPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");

    startTransition(async () => {
      const result = await updateOwnProfileAction({
        username,
        name,
        currentPassword,
        ...(newPassword ? { newPassword } : {}),
      });

      if (!result.ok) {
        setPasswordError(result.message);
        return;
      }

      if (result.credentialsChanged) {
        router.replace("/login");
        return;
      }

      setCurrentPassword("");
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Profil berhasil diperbarui.");
      router.refresh();
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Akun Saya</h1>
        <p className="mt-0.5 text-sm text-slate-600">Perbarui informasi akun dan kredensial login Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
          <UserRound className="mt-0.5 h-5 w-5 text-[#1E3A5F]" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Informasi profil</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">Gunakan username yang akan dipakai saat login.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <TextField id="profile-username" label="Username" value={username} onChange={setUsername} autoComplete="username" required />
          <TextField id="profile-name" label="Nama Lengkap" value={name} onChange={setName} autoComplete="name" required />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 text-[#1E3A5F]" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Keamanan</h2>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">Ubah password hanya bila diperlukan. Mengubah username atau password akan mengeluarkan Anda dari semua perangkat.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField id="profile-new-password" label="Password Baru" value={newPassword} onChange={setNewPassword} type="password" autoComplete="new-password" helperText="Kosongkan jika tidak ingin mengganti password." />
            <TextField id="profile-confirm-password" label="Konfirmasi Password Baru" value={confirmPassword} onChange={setConfirmPassword} type="password" autoComplete="new-password" required={Boolean(newPassword)} />
          </div>
        </div>

        {error && <Message variant="error" message={error} />}
        {success && <Message variant="success" message={success} />}

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button type="submit" disabled={isPending} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#162C47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      {passwordDialogOpen && <PasswordConfirmationDialog currentPassword={currentPassword} onChange={setCurrentPassword} error={passwordError} pending={isPending} onCancel={() => { setPasswordDialogOpen(false); setCurrentPassword(""); setPasswordError(""); }} onSubmit={handleConfirmPassword} />}
    </div>
  );
}

function TextField({ id, label, value, onChange, type = "text", autoComplete, helperText, required = false }: { id: string; label: string; value: string; onChange: (value: string) => void; type?: "text" | "password"; autoComplete?: string; helperText?: string; required?: boolean }) {
  return <div><label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">{label}</label><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required={required} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20" />{helperText && <p className="mt-1.5 text-xs leading-5 text-slate-500">{helperText}</p>}</div>;
}

function Message({ variant, message }: { variant: "error" | "success"; message: string }) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;
  const style = variant === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return <div className={`mt-5 flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${style}`} role="status"><Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{message}</div>;
}

function PasswordConfirmationDialog({ currentPassword, onChange, error, pending, onCancel, onSubmit }: { currentPassword: string; onChange: (value: string) => void; error: string; pending: boolean; onCancel: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-password-title"><form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl"><h2 id="confirm-password-title" className="text-base font-bold text-slate-900">Konfirmasi perubahan</h2><p className="mt-1.5 text-sm leading-5 text-slate-600">Masukkan password saat ini untuk menyimpan perubahan pada akun Anda.</p><div className="mt-4"><TextField id="confirm-current-password" label="Password Saat Ini" value={currentPassword} onChange={onChange} type="password" autoComplete="current-password" required /></div>{error && <Message variant="error" message={error} />}<div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onCancel} disabled={pending} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] disabled:cursor-not-allowed disabled:opacity-50">Batal</button><button type="submit" disabled={pending} className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#162C47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Menyimpan..." : "Konfirmasi & Simpan"}</button></div></form></div>;
}
