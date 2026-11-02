import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MonthNav } from "@/components/month-nav";
import type { DashboardData } from "@/lib/data/dashboard";
import { SummaryCards } from "./summary-cards";
import { MonthlyChart } from "./monthly-chart";
import { ExpenseBreakdown } from "./expense-breakdown";
import { BudgetProjection } from "./budget-projection";
import { BillsCard } from "./bills-card";
import { monthParam } from "@/lib/format";

export function DashboardView({
  data,
  currency,
  canEditBudget,
}: {
  data: DashboardData;
  currency: string;
  canEditBudget: boolean;
}) {
  const isFuture = !data.isCurrent && !data.isPast;
  const nothingYet =
    data.series.every((p) => p.income === 0 && p.expense === 0) &&
    data.projection.incomePlanned === 0 &&
    data.projection.expensePlanned === 0;

  return (
    <div className="space-y-6">
      <MonthNav month={data.month} basePath="/dashboard" />

      {nothingYet && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Comece em 2 passos</p>
          <ol className="mt-2 space-y-2">
            <li>
              <Link href="/fixed" className="flex items-center gap-1.5 font-medium text-blue-700">
                1. Cadastre suas contas e receitas fixas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
            <li>
              <Link
                href="/transactions"
                className="flex items-center gap-1.5 font-medium text-blue-700"
              >
                2. Lance os gastos e ganhos do dia a dia <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          </ol>
        </div>
      )}

      <SummaryCards
        income={data.realized.income}
        expense={data.realized.expense}
        balance={data.realized.balance}
        currency={currency}
        isCurrent={data.isCurrent}
        isFuture={isFuture}
      />

      <BillsCard
        bills={data.bills}
        currency={currency}
        monthParam={data.isCurrent ? null : monthParam(data.month)}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Últimos 6 meses</h2>
        <MonthlyChart points={data.series} currency={currency} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Para onde foi o dinheiro</h2>
        <p className="mb-4 text-xs text-slate-500">Despesas do mês por categoria</p>
        <ExpenseBreakdown slices={data.expenseSlices} currency={currency} />
      </section>

      <div className="pt-2">
        <h2 className="mb-3 px-1 text-base font-semibold text-slate-900">
          Orçamento e projeção do mês
        </h2>
        <BudgetProjection data={data} currency={currency} canEdit={canEditBudget} />
      </div>
    </div>
  );
}
