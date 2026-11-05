import { daysInMonth, monthStartOf } from "@/lib/format";

export type FlowType = "income" | "expense";
export type FixedFrequency = "monthly" | "yearly";
/** Onde o dinheiro está: conta/dinheiro ou vale (VA/VR). */
export type Wallet = "cash" | "benefit";

export const WALLET_LABELS: Record<Wallet, string> = {
  cash: "Dinheiro",
  benefit: "VA/VR",
};

/**
 * Receita ou despesa fixa: se repete todo mês no mesmo dia, ou uma vez por
 * ano (ex: IPVA) no mês e dia combinados.
 */
export interface FixedItem {
  id: string;
  description: string;
  amount: number;
  type: FlowType;
  frequency: FixedFrequency;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  /** receitas: entra como dinheiro ou como vale (VA/VR) */
  wallet: Wallet;
  /** despesas: debitada sozinha no vencimento (não precisa lembrar de pagar) */
  autoDebit: boolean;
}

/** Pagamento de uma conta fixa em um mês específico. */
export interface FixedPayment {
  ruleId: string;
  /** primeiro dia do mês a que a conta se refere (AAAA-MM-01) */
  month: string;
  paidDate: string;
  amount: number;
}

export function fixedActiveInMonth(item: FixedItem, monthStart: string) {
  const m = monthStart.slice(0, 7);
  if (item.startDate.slice(0, 7) > m) return false;
  if (item.endDate && item.endDate.slice(0, 7) < m) return false;
  // conta anual só cai no mesmo mês do ano em que foi cadastrada
  if (item.frequency === "yearly" && item.startDate.slice(5, 7) !== m.slice(5, 7)) {
    return false;
  }
  return true;
}

/** Dia do vencimento no mês (ex: dia 31 em fevereiro vira dia 28/29). */
export function fixedDueDay(item: FixedItem, monthStart: string) {
  return Math.min(Math.max(item.dayOfMonth, 1), daysInMonth(monthStart));
}

export function fixedDueDate(item: FixedItem, monthStart: string) {
  return `${monthStart.slice(0, 7)}-${String(fixedDueDay(item, monthStart)).padStart(2, "0")}`;
}

export interface FixedTotals {
  incomePlanned: number;
  expensePlanned: number;
  incomeRealized: number;
  /** parte de incomeRealized que entrou como vale (VA/VR) */
  incomeRealizedBenefit: number;
  /** despesas fixas efetivamente pagas (ou debitadas automaticamente) no mês */
  expenseRealized: number;
}

/**
 * Totais dos itens fixos de um mês.
 * - Receitas: contam como "realizadas" a partir do dia do vencimento (meses
 *   passados inteiros, mês atual até hoje, futuros nada).
 * - Despesas: contam como "realizadas" só quando marcadas como pagas (pelo
 *   valor realmente pago); o previsto usa o valor pago ou, se ainda não
 *   pagou, o valor cadastrado.
 */
export function fixedTotals(
  items: FixedItem[],
  monthStart: string,
  today: string,
  payments: FixedPayment[],
): FixedTotals {
  const currentMonth = monthStartOf(today);
  const todayDay = Number(today.slice(8, 10));
  const monthPayments = payments.filter((p) => p.month === monthStart);
  const paidBy = new Map(monthPayments.map((p) => [p.ruleId, p.amount]));
  const totals: FixedTotals = {
    incomePlanned: 0,
    expensePlanned: 0,
    incomeRealized: 0,
    incomeRealizedBenefit: 0,
    expenseRealized: monthPayments.reduce((sum, p) => sum + p.amount, 0),
  };

  const activeExpenseIds = new Set<string>();
  for (const item of items) {
    if (!fixedActiveInMonth(item, monthStart)) continue;

    if (item.type === "income") {
      totals.incomePlanned += item.amount;
      const realized =
        monthStart < currentMonth ||
        (monthStart === currentMonth && fixedDueDay(item, monthStart) <= todayDay);
      if (realized) {
        totals.incomeRealized += item.amount;
        if (item.wallet === "benefit") totals.incomeRealizedBenefit += item.amount;
      }
    } else {
      activeExpenseIds.add(item.id);
      totals.expensePlanned += paidBy.get(item.id) ?? item.amount;
      // débito automático sem ajuste manual: conta como paga a partir do vencimento
      if (
        item.autoDebit &&
        !paidBy.has(item.id) &&
        (monthStart < currentMonth ||
          (monthStart === currentMonth && fixedDueDay(item, monthStart) <= todayDay))
      ) {
        totals.expenseRealized += item.amount;
      }
    }
  }
  // pagamentos de contas que já foram encerradas ainda contam no mês em que ocorreram
  for (const p of monthPayments) {
    if (!activeExpenseIds.has(p.ruleId)) totals.expensePlanned += p.amount;
  }
  return totals;
}

/**
 * paid = paga; overdue/today/upcoming = a pagar à mão; auto_done = já debitada
 * automaticamente; auto_scheduled = débito automático ainda por vir.
 */
export type BillStatus =
  | "paid"
  | "overdue"
  | "today"
  | "upcoming"
  | "auto_done"
  | "auto_scheduled";

/** Contas que não exigem ação do usuário (débito automático). */
export function isAutoStatus(status: BillStatus) {
  return status === "auto_done" || status === "auto_scheduled";
}

/** Uma despesa fixa que vence em determinado mês, com a situação do pagamento. */
export interface Bill {
  item: FixedItem;
  month: string;
  dueDate: string;
  status: BillStatus;
  paidDate: string | null;
  paidAmount: number | null;
}

export function buildBills(
  items: FixedItem[],
  payments: FixedPayment[],
  monthStart: string,
  today: string,
): Bill[] {
  const paidBy = new Map(
    payments.filter((p) => p.month === monthStart).map((p) => [p.ruleId, p]),
  );
  return items
    .filter((i) => i.type === "expense" && fixedActiveInMonth(i, monthStart))
    .map((item): Bill => {
      const dueDate = fixedDueDate(item, monthStart);
      const payment = paidBy.get(item.id);
      const status: BillStatus = payment
        ? "paid"
        : item.autoDebit
          ? dueDate <= today
            ? "auto_done"
            : "auto_scheduled"
          : dueDate < today
            ? "overdue"
            : dueDate === today
              ? "today"
              : "upcoming";
      return {
        item,
        month: monthStart,
        dueDate,
        status,
        paidDate: payment?.paidDate ?? (status === "auto_done" ? dueDate : null),
        paidAmount: payment?.amount ?? (status === "auto_done" ? item.amount : null),
      };
    })
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) ||
        a.item.description.localeCompare(b.item.description),
    );
}

export interface BillSummary {
  /** já pago (inclui o que foi debitado automaticamente) */
  paidTotal: number;
  /** falta pagar à mão */
  pendingTotal: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  /** débito automático que ainda vai cair no mês */
  autoTotal: number;
  autoCount: number;
}

export function summarizeBills(bills: Bill[]): BillSummary {
  const summary: BillSummary = {
    paidTotal: 0,
    pendingTotal: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    autoTotal: 0,
    autoCount: 0,
  };
  for (const bill of bills) {
    if (bill.status === "auto_scheduled") {
      summary.autoTotal += bill.item.amount;
      summary.autoCount += 1;
    } else if (bill.status === "paid" || bill.status === "auto_done") {
      summary.paidTotal += bill.paidAmount ?? bill.item.amount;
      summary.paidCount += 1;
    } else {
      summary.pendingTotal += bill.item.amount;
      summary.pendingCount += 1;
      if (bill.status === "overdue") summary.overdueCount += 1;
    }
  }
  return summary;
}

export interface DueAlert {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  /** negativo = dias de atraso; 0 = hoje */
  daysLeft: number;
}

/** Dias entre duas datas AAAA-MM-DD (b - a). */
export function daysBetween(a: string, b: string) {
  const ms = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  return Math.round((ms(b) - ms(a)) / 86_400_000);
}

export const DUE_SOON_DAYS = 3;

/**
 * Contas a pagar à mão que já venceram ou vencem nos próximos dias.
 * Débito automático nunca entra (não exige ação).
 */
export function buildDueAlerts(bills: Bill[], today: string): DueAlert[] {
  return bills
    .filter((b) => b.status === "overdue" || b.status === "today" || b.status === "upcoming")
    .map((b) => ({
      id: `${b.item.id}-${b.month}`,
      name: b.item.description,
      amount: b.item.amount,
      dueDate: b.dueDate,
      daysLeft: daysBetween(today, b.dueDate),
    }))
    .filter((a) => a.daysLeft <= DUE_SOON_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft || a.name.localeCompare(b.name));
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
