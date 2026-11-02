import type { CategoryKind } from "@/lib/types";

export const DEFAULT_CATEGORIES: Array<{
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
}> = [
  { name: "Mercado", kind: "expense", color: "#f97316", icon: "shopping-cart" },
  { name: "Restaurantes", kind: "expense", color: "#eb6834", icon: "utensils" },
  { name: "Transporte", kind: "expense", color: "#0891b2", icon: "car" },
  { name: "Saúde", kind: "expense", color: "#dc2626", icon: "heart-pulse" },
  { name: "Lazer", kind: "expense", color: "#db2777", icon: "party-popper" },
  { name: "Compras", kind: "expense", color: "#ca8a04", icon: "shopping-bag" },
  { name: "Educação", kind: "expense", color: "#7c3aed", icon: "graduation-cap" },
  { name: "Casa", kind: "expense", color: "#2563eb", icon: "home" },
  { name: "Outros gastos", kind: "expense", color: "#475569", icon: "more-horizontal" },

  { name: "Salário", kind: "income", color: "#16a34a", icon: "banknote" },
  { name: "Extra / Freelance", kind: "income", color: "#0d9488", icon: "briefcase" },
  { name: "Outras receitas", kind: "income", color: "#15803d", icon: "more-horizontal" },
];
