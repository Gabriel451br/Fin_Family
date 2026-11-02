import type { MemberRole } from "@/lib/types";

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Proprietário(a)",
  admin: "Administrador(a)",
  member: "Membro",
  viewer: "Apenas visualização",
};

export const CATEGORY_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#475569",
];
