export type AdminCategory = { id: string; name: string; status: "ACTIVE" | "INACTIVE" };

export type CategoryActionResult = { ok: true } | { ok: false; message: string };
