import type { Permissions } from "@/lib/types";
import type { CurrentMember } from "@/lib/auth";

export class PermissionError extends Error {
  constructor(message = "Você não tem permissão para fazer isso.") {
    super(message);
    this.name = "PermissionError";
  }
}

export const PERMISSION_LABELS: Record<keyof Permissions, string> = {
  manage_members: "Gerenciar membros e convites",
  manage_accounts: "Gerenciar contas",
  manage_categories: "Alterar a lista de categorias",
  add_transactions: "Lançar receitas e despesas",
  edit_all_transactions: "Editar transações de qualquer membro",
  edit_own_transactions: "Editar as próprias transações",
  manage_budgets_goals: "Alterar itens fixos e orçamento",
  view_reports: "Ver o painel",
};

export function hasPermission(
  member: Pick<CurrentMember, "permissions" | "role">,
  key: keyof Permissions,
) {
  if (member.role === "owner") return true;
  return Boolean(member.permissions?.[key]);
}

export function requirePermission(
  member: Pick<CurrentMember, "permissions" | "role">,
  key: keyof Permissions,
) {
  if (!hasPermission(member, key)) {
    throw new PermissionError();
  }
}

export function canEditTransaction(
  member: Pick<CurrentMember, "id" | "permissions" | "role">,
  transactionMemberId: string | null,
) {
  if (hasPermission(member, "edit_all_transactions")) return true;
  if (
    hasPermission(member, "edit_own_transactions") &&
    transactionMemberId === member.id
  ) {
    return true;
  }
  return false;
}
