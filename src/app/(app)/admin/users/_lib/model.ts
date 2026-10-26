import type { Role } from "@/generated/prisma/client";

export type AdminUser = {
  id: string;
  username: string;
  name: string;
  roles: Array<{ role: Role }>;
  status: "ACTIVE" | "INACTIVE";
  unit: { id: string; name: string } | null;
};

export type UnitOption = {
  id: string;
  name: string;
};

export type UserActionResult =
  | { ok: true }
  | { ok: false; message: string };

export const availableRoles = [
  ["REQUESTER", "Kepala Unit / SPV"],
  ["UNIT_MANAGER", "Manager Unit"],
  ["CONSIDERATION", "Pemberi Pertimbangan"],
  ["FINANCE_APPROVER", "Approver Keuangan"],
  ["GENERAL_AFFAIRS", "TU / Umum"],
  ["SUPERADMIN", "Superadmin"],
] as const satisfies ReadonlyArray<readonly [Role, string]>;
