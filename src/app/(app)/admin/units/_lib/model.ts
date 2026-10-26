export type AdminUnit = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  manager: { id: string; name: string } | null;
  _count: { members: number };
};

export type ManagerCandidate = {
  id: string;
  name: string;
};

export type UnitActionResult =
  | { ok: true }
  | { ok: false; message: string };
