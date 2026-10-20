import type {
  AccountType,
  CategoryKind,
  GoalKind,
  MemberRole,
  RecurrenceFrequency,
  TransactionType,
} from "@/lib/types";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  investment: "Investimentos",
  credit_card: "Cartão de crédito",
  cash: "Dinheiro",
  other: "Outro",
};

export const CATEGORY_KIND_LABELS: Record<CategoryKind, string> = {
  expense: "Despesa",
  income: "Receita",
  investment: "Investimento",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  expense: "Despesa",
  income: "Receita",
  investment: "Investimento",
  transfer: "Transferência",
};

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export const GOAL_KIND_LABELS: Record<GoalKind, string> = {
  expense_limit: "Limite de gasto",
  income_target: "Meta de renda",
  investment_target: "Meta de investimento",
  savings_target: "Meta de economia",
  custom: "Personalizada",
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Proprietário(a)",
  admin: "Administrador(a)",
  member: "Membro",
  viewer: "Apenas visualização",
};

export const ACCOUNT_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#475569",
];
