import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export function SummaryCards({
  income,
  expense,
  balance,
  currency,
  isCurrent,
  isFuture,
}: {
  income: number;
  expense: number;
  balance: number;
  currency: string;
  isCurrent: boolean;
  isFuture: boolean;
}) {
  const caption = isFuture
    ? "Ainda não aconteceu — veja a projeção abaixo"
    : isCurrent
      ? "Realizado até hoje"
      : "Realizado no mês";
  const negative = balance < 0;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Saldo do mês
        </p>
        <p className="mt-1 text-4xl font-semibold tabular-nums text-slate-900">
          {negative ? "−" : ""}
          {formatCurrency(Math.abs(balance), currency)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          {negative && !isFuture ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-[#d03b3b]" aria-hidden />
              <span className="font-medium text-slate-700">Gastou mais do que recebeu.</span>
            </>
          ) : null}
          {caption}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2a78d6]" />
            Receitas
            <TrendingUp className="ml-auto h-3.5 w-3.5 text-slate-400" aria-hidden />
          </p>
          <p className="mt-1 truncate text-xl font-semibold tabular-nums text-slate-900">
            {formatCurrency(income, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-[#eb6834]" />
            Despesas
            <TrendingDown className="ml-auto h-3.5 w-3.5 text-slate-400" aria-hidden />
          </p>
          <p className="mt-1 truncate text-xl font-semibold tabular-nums text-slate-900">
            {formatCurrency(expense, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
