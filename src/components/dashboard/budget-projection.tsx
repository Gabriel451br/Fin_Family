import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { formatCurrency, formatMonth } from "@/lib/format";
import type { DashboardData } from "@/lib/data/dashboard";
import { cn } from "@/lib/cn";

const CRITICAL = "#d03b3b";
const WARNING = "#fab219";
const NEUTRAL = "#334155";

function rowStatus(pct: number) {
  if (pct > 100) return { color: CRITICAL, label: "Estourou", Icon: AlertTriangle };
  if (pct >= 80) return { color: WARNING, label: "Quase no limite", Icon: AlertTriangle };
  return { color: NEUTRAL, label: "Dentro do orçamento", Icon: CheckCircle2 };
}

export function BudgetProjection({
  data,
  currency,
  canEdit,
}: {
  data: DashboardData;
  currency: string;
  canEdit: boolean;
}) {
  const { projection: p, budgetRows, budgetTotals, isPast, isCurrent, daysLeft } = data;
  const negative = p.balance < 0;
  const totalRemaining = budgetTotals.limit - budgetTotals.spent;
  const perDay =
    isCurrent && daysLeft > 0 && totalRemaining > 0 ? totalRemaining / daysLeft : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">
          {isPast ? "Resultado do mês" : "Projeção do mês"}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{formatMonth(data.month)}</p>

        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          {isPast ? "Saldo final" : "Saldo previsto no fim do mês"}
        </p>
        <p className="text-3xl font-semibold tabular-nums text-slate-900">
          {negative ? "−" : ""}
          {formatCurrency(Math.abs(p.balance), currency)}
        </p>
        {negative && !isPast && (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: CRITICAL }} aria-hidden />
            No ritmo previsto, o mês fecha no negativo.
          </p>
        )}

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <div className="flex items-baseline justify-between">
              <dt className="flex items-center gap-1.5 font-medium text-slate-800">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2a78d6]" />
                Receitas {isPast ? "" : "previstas"}
              </dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatCurrency(p.incomePlanned, currency)}
              </dd>
            </div>
            <p className="ml-4 text-xs text-slate-500">
              {formatCurrency(p.fixedIncome, currency)} fixas +{" "}
              {formatCurrency(p.variableIncome, currency)} variáveis
            </p>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <dt className="flex items-center gap-1.5 font-medium text-slate-800">
                <span className="h-2.5 w-2.5 rounded-full bg-[#eb6834]" />
                Despesas {isPast ? "" : "previstas"}
              </dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {formatCurrency(p.expensePlanned, currency)}
              </dd>
            </div>
            <p className="ml-4 text-xs text-slate-500">
              {formatCurrency(p.fixedExpense, currency)} fixas +{" "}
              {formatCurrency(p.variableExpense, currency)} variáveis
            </p>
          </div>
        </dl>

        {!isPast && (
          <p className="mt-4 flex gap-1.5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span>
              Considera todos os fixos do mês e que cada categoria com orçamento será usada até o
              limite. Categorias sem orçamento entram só com o que já foi gasto.
            </span>
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Orçamento do mês</h3>
            <p className="mt-1 text-xs text-slate-500">Gastos variáveis por categoria</p>
          </div>
          {canEdit && (
            <Link
              href="/budgets"
              className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
            >
              {budgetRows.length ? "Editar" : "Definir"}
            </Link>
          )}
        </div>

        {budgetRows.length === 0 ? (
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
            Nenhum orçamento definido. Defina um limite mensal por categoria para acompanhar aqui
            quanto ainda pode gastar.
          </p>
        ) : (
          <>
            <div className="mt-4">
              <p className="text-sm tabular-nums text-slate-600">
                <span className="text-xl font-semibold text-slate-900">
                  {formatCurrency(budgetTotals.spent, currency)}
                </span>{" "}
                de {formatCurrency(budgetTotals.limit, currency)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {totalRemaining >= 0
                  ? `Ainda restam ${formatCurrency(totalRemaining, currency)}`
                  : `Passou ${formatCurrency(-totalRemaining, currency)} do total orçado`}
                {perDay !== null && (
                  <> · dá {formatCurrency(perDay, currency)} por dia ({daysLeft} dias)</>
                )}
              </p>
            </div>

            <ul className="mt-4 space-y-4">
              {budgetRows.map((row) => {
                const status = rowStatus(row.pct);
                return (
                  <li key={row.categoryId}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-slate-800">{row.name}</span>
                      <span className="shrink-0 tabular-nums text-xs text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(row.spent, currency)}
                        </span>{" "}
                        / {formatCurrency(row.limit, currency)}
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(100, Math.round(row.pct))}
                      aria-label={`${row.name}: ${Math.round(row.pct)}% do orçamento`}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(row.spent > 0 ? 2 : 0, row.pct))}%`,
                          backgroundColor: status.color,
                        }}
                      />
                    </div>
                    <p
                      className={cn(
                        "mt-1 flex items-center gap-1 text-xs",
                        row.pct >= 80 ? "font-medium text-slate-800" : "text-slate-500",
                      )}
                    >
                      <status.Icon
                        className="h-3 w-3"
                        style={{ color: row.pct >= 80 ? status.color : "#94a3b8" }}
                        aria-hidden
                      />
                      {row.remaining >= 0
                        ? `${status.label} · restam ${formatCurrency(row.remaining, currency)}`
                        : `${status.label} em ${formatCurrency(-row.remaining, currency)}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
