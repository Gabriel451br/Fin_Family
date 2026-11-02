import { daysInMonth, monthStartOf } from "@/lib/format";

export type FlowType = "income" | "expense";

/** Receita ou despesa fixa: se repete todo mês no mesmo dia. */
export interface FixedItem {
  id: string;
  description: string;
  amount: number;
  type: FlowType;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
}

export function fixedActiveInMonth(item: FixedItem, monthStart: string) {
  const m = monthStart.slice(0, 7);
  if (item.startDate.slice(0, 7) > m) return false;
  if (item.endDate && item.endDate.slice(0, 7) < m) return false;
  return true;
}

/** Dia do vencimento no mês (ex: dia 31 em fevereiro vira dia 28/29). */
export function fixedDueDay(item: FixedItem, monthStart: string) {
  return Math.min(Math.max(item.dayOfMonth, 1), daysInMonth(monthStart));
}

export interface FixedTotals {
  incomePlanned: number;
  expensePlanned: number;
  incomeRealized: number;
  expenseRealized: number;
}

/**
 * Totais dos itens fixos de um mês. Um item fixo conta como "realizado" a
 * partir do dia do vencimento: meses passados inteiros, mês atual até hoje,
 * meses futuros nada.
 */
export function fixedTotals(
  items: FixedItem[],
  monthStart: string,
  today: string,
): FixedTotals {
  const currentMonth = monthStartOf(today);
  const todayDay = Number(today.slice(8, 10));
  const totals: FixedTotals = {
    incomePlanned: 0,
    expensePlanned: 0,
    incomeRealized: 0,
    expenseRealized: 0,
  };

  for (const item of items) {
    if (!fixedActiveInMonth(item, monthStart)) continue;
    const realized =
      monthStart < currentMonth ||
      (monthStart === currentMonth && fixedDueDay(item, monthStart) <= todayDay);

    if (item.type === "income") {
      totals.incomePlanned += item.amount;
      if (realized) totals.incomeRealized += item.amount;
    } else {
      totals.expensePlanned += item.amount;
      if (realized) totals.expenseRealized += item.amount;
    }
  }
  return totals;
}

export interface CategorySpend {
  categoryId: string | null;
  name: string;
  spent: number;
}

export interface BudgetLimit {
  categoryId: string;
  name: string;
  limit: number;
}

export interface BudgetRow {
  categoryId: string;
  name: string;
  limit: number;
  spent: number;
  /** quanto falta (negativo = estourou) */
  remaining: number;
  /** 0-100+ (pode passar de 100 quando estoura) */
  pct: number;
}

export function buildBudgetRows(
  limits: BudgetLimit[],
  spends: CategorySpend[],
): BudgetRow[] {
  const spentBy = new Map(spends.map((s) => [s.categoryId, s.spent]));
  return limits
    .filter((l) => l.limit > 0)
    .map((l) => {
      const spent = spentBy.get(l.categoryId) ?? 0;
      return {
        categoryId: l.categoryId,
        name: l.name,
        limit: l.limit,
        spent,
        remaining: l.limit - spent,
        pct: (spent / l.limit) * 100,
      };
    })
    .sort((a, b) => b.pct - a.pct);
}

export interface Projection {
  incomePlanned: number;
  expensePlanned: number;
  fixedExpense: number;
  variableExpense: number;
  fixedIncome: number;
  variableIncome: number;
  balance: number;
}

/**
 * Projeção do fim do mês:
 * - receitas = fixas do mês + variáveis já recebidas;
 * - despesas = fixas do mês + variáveis, assumindo que cada categoria com
 *   orçamento será usada até o limite (se já passou, vale o gasto real).
 * Mês passado: a projeção é o próprio realizado.
 */
export function buildProjection(args: {
  monthStart: string;
  today: string;
  fixed: FixedTotals;
  variableIncome: number;
  variableExpense: number;
  budgetRows: BudgetRow[];
}): Projection {
  const { monthStart, today, fixed, variableIncome, variableExpense, budgetRows } =
    args;
  const isPast = monthStart < monthStartOf(today);

  const fixedIncome = isPast ? fixed.incomeRealized : fixed.incomePlanned;
  const fixedExpense = isPast ? fixed.expenseRealized : fixed.expensePlanned;
  const budgetGap = isPast
    ? 0
    : budgetRows.reduce((sum, r) => sum + Math.max(0, r.remaining), 0);

  const variableExpenseProjected = variableExpense + budgetGap;
  const incomePlanned = fixedIncome + variableIncome;
  const expensePlanned = fixedExpense + variableExpenseProjected;

  return {
    incomePlanned,
    expensePlanned,
    fixedExpense,
    variableExpense: variableExpenseProjected,
    fixedIncome,
    variableIncome,
    balance: incomePlanned - expensePlanned,
  };
}
