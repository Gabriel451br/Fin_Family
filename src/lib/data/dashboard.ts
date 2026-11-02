import {
  addMonthsISO,
  currentMonthStartISO,
  formatMonthShort,
  todayISO,
} from "@/lib/format";
import {
  buildBudgetRows,
  buildProjection,
  buildBills,
  fixedTotals,
  summarizeBills,
  type BillSummary,
  type BudgetRow,
  type Projection,
} from "@/lib/finance";
import { listFixedItems } from "@/lib/data/fixed";
import { listPayments } from "@/lib/data/payments";
import { getBudgetLimits } from "@/lib/data/budgets";
import {
  getExpenseByCategory,
  getMonthlyVariableTotals,
} from "@/lib/data/transactions";

export interface MonthPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface ExpenseSlice {
  name: string;
  amount: number;
}

export interface DashboardData {
  month: string;
  isCurrent: boolean;
  isPast: boolean;
  realized: { income: number; expense: number; balance: number };
  series: MonthPoint[];
  expenseSlices: ExpenseSlice[];
  budgetRows: BudgetRow[];
  budgetTotals: { limit: number; spent: number };
  projection: Projection;
  daysLeft: number;
  bills: BillSummary & { nextDue: { name: string; amount: number; dueDate: string } | null };
}

const MAX_SLICES = 6;

export async function getDashboardData(
  familyId: string,
  monthStart: string,
): Promise<DashboardData> {
  const today = todayISO();
  const currentMonth = currentMonthStartISO();
  const seriesStart = addMonthsISO(monthStart, -5);

  const [fixedItems, payments, monthlyVariable, byCategory, limits] = await Promise.all([
    listFixedItems(familyId),
    listPayments(familyId, seriesStart, monthStart),
    getMonthlyVariableTotals(familyId, seriesStart, monthStart),
    getExpenseByCategory(familyId, monthStart),
    getBudgetLimits(familyId, monthStart),
  ]);

  const series: MonthPoint[] = [];
  for (let i = 0; i < 6; i++) {
    const month = addMonthsISO(seriesStart, i);
    const variable = monthlyVariable[month] ?? { income: 0, expense: 0 };
    const fixed = fixedTotals(fixedItems, month, today, payments);
    series.push({
      month,
      label: formatMonthShort(month),
      income: variable.income + fixed.incomeRealized,
      expense: variable.expense + fixed.expenseRealized,
    });
  }

  const fixed = fixedTotals(fixedItems, monthStart, today, payments);
  const variable = monthlyVariable[monthStart] ?? { income: 0, expense: 0 };
  const realizedIncome = variable.income + fixed.incomeRealized;
  const realizedExpense = variable.expense + fixed.expenseRealized;

  const slices: ExpenseSlice[] = byCategory.map((c) => ({
    name: c.name,
    amount: c.spent,
  }));
  if (fixed.expenseRealized > 0) {
    slices.push({ name: "Despesas fixas", amount: fixed.expenseRealized });
  }
  slices.sort((a, b) => b.amount - a.amount);
  const expenseSlices =
    slices.length > MAX_SLICES
      ? [
          ...slices.slice(0, MAX_SLICES - 1),
          {
            name: "Outras",
            amount: slices
              .slice(MAX_SLICES - 1)
              .reduce((sum, s) => sum + s.amount, 0),
          },
        ]
      : slices;

  const budgetRows = buildBudgetRows(limits, byCategory);
  const projection = buildProjection({
    monthStart,
    today,
    fixed,
    variableIncome: variable.income,
    variableExpense: variable.expense,
    budgetRows,
  });

  const isCurrent = monthStart === currentMonth;
  const isPast = monthStart < currentMonth;
  const lastDay = new Date(
    Date.UTC(Number(monthStart.slice(0, 4)), Number(monthStart.slice(5, 7)), 0),
  ).getUTCDate();
  const daysLeft = isCurrent
    ? lastDay - Number(today.slice(8, 10))
    : isPast
      ? 0
      : lastDay;

  const bills = buildBills(fixedItems, payments, monthStart, today);
  const nextBill = bills.find((b) => b.status !== "paid") ?? null;

  return {
    month: monthStart,
    isCurrent,
    isPast,
    realized: {
      income: realizedIncome,
      expense: realizedExpense,
      balance: realizedIncome - realizedExpense,
    },
    series,
    expenseSlices,
    budgetRows,
    budgetTotals: {
      limit: budgetRows.reduce((sum, r) => sum + r.limit, 0),
      spent: budgetRows.reduce((sum, r) => sum + r.spent, 0),
    },
    projection,
    daysLeft,
    bills: {
      ...summarizeBills(bills),
      nextDue: nextBill
        ? {
            name: nextBill.item.description,
            amount: nextBill.item.amount,
            dueDate: nextBill.dueDate,
          }
        : null,
    },
  };
}
