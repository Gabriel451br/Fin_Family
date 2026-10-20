import type { CategoryKind } from "@/lib/types";

export const DEFAULT_CATEGORIES: Array<{
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
}> = [
  { name: "Moradia", kind: "expense", color: "#2563eb", icon: "home" },
  { name: "Alimentação", kind: "expense", color: "#f97316", icon: "utensils" },
  { name: "Transporte", kind: "expense", color: "#0891b2", icon: "car" },
  { name: "Saúde", kind: "expense", color: "#dc2626", icon: "heart-pulse" },
  { name: "Educação", kind: "expense", color: "#7c3aed", icon: "graduation-cap" },
  { name: "Lazer", kind: "expense", color: "#db2777", icon: "party-popper" },
  { name: "Compras", kind: "expense", color: "#ca8a04", icon: "shopping-bag" },
  { name: "Assinaturas", kind: "expense", color: "#64748b", icon: "repeat" },
  { name: "Cuidados pessoais", kind: "expense", color: "#059669", icon: "sparkles" },
  { name: "Outros gastos", kind: "expense", color: "#475569", icon: "more-horizontal" },

  { name: "Salário", kind: "income", color: "#16a34a", icon: "banknote" },
  { name: "Freelance", kind: "income", color: "#0d9488", icon: "briefcase" },
  { name: "Rendimentos", kind: "income", color: "#65a30d", icon: "trending-up" },
  { name: "Outras receitas", kind: "income", color: "#15803d", icon: "more-horizontal" },

  { name: "Renda fixa", kind: "investment", color: "#4338ca", icon: "landmark" },
  { name: "Ações / Fundos", kind: "investment", color: "#6d28d9", icon: "line-chart" },
  { name: "Reserva de emergência", kind: "investment", color: "#9333ea", icon: "shield" },
  { name: "Previdência", kind: "investment", color: "#a21caf", icon: "piggy-bank" },
];
