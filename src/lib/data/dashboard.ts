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
  buildDueAlerts,
  fixedTotals,
  summarizeBills,
  type BillSummary,
  type BudgetRow,
  type DueAlert,
  type Projection,
} from "@/lib/finance";
import { listFixedItems } from "@/lib/data/fixed";
import { listPayments } from "@/lib/data/payments";
import { getBudgetLimits } from "@/lib/data/budgets";
import {
  getExpenseByCategory,
  getMonthlyVariableTotals,
  getWalletTotals,
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

export interface WalletBalance {
  income: number;
  expense: number;
  balance: number;
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
  wallets: { cash: WalletBalance; benefit: WalletBalance };
  /** contas a pagar à mão atrasadas ou que vencem em poucos dias (só no mês atual) */
  alerts: DueAlert[];
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

  const isCurrent = monthStart === currentMonth;
  // no mês atual também olhamos o mês seguinte (contas do dia 1º avisam no fim do mês)
  const paymentsTo = isCurrent ? addMonthsISO(monthStart, 1) : monthStart;

  const [fixedItems, payments, monthlyVariable, byCategory, limits, walletVariable] =
    await Promise.all([
    listFixedItems(familyId),
    listPayments(familyId, seriesStart, paymentsTo),
    getMonthlyVariableTotals(familyId, seriesStart, monthStart),
    getExpenseByCategory(familyId, monthStart),
    getBudgetLimits(familyId, monthStart),
    getWalletTotals(familyId, monthStart),
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
  const nextBill =
    bills.find((b) => ["overdue", "today", "upcoming"].includes(b.status)) ?? null;

  // Dinheiro x VA/VR: variáveis por carteira + receitas fixas de vale; despesas fixas são em dinheiro
  const fixedBenefitIncome = fixed.incomeRealizedBenefit;
  const cashIncome = walletVariable.cash.income + (fixed.incomeRealized - fixedBenefitIncome);
  const cashExpense = walletVariable.cash.expense + fixed.expenseRealized;
  const benefitIncome = walletVariable.benefit.income + fixedBenefitIncome;
  const benefitExpense = walletVariable.benefit.expense;

  const alerts = isCurrent
    ? buildDueAlerts(
        [
          ...buildBills(fixedItems, payments, addMonthsISO(monthStart, -1), today),
          ...bills,
          ...buildBills(fixedItems, payments, addMonthsISO(monthStart, 1), today),
        ],
        today,
      )
    : [];

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
    wallets: {
      cash: { income: cashIncome, expense: cashExpense, balance: cashIncome - cashExpense },
      benefit: {
        income: benefitIncome,
        expense: benefitExpense,
        balance: benefitIncome - benefitExpense,
      },
    },
    alerts,
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
