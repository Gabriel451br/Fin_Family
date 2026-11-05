import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import { formatCurrency, formatDayMonth } from "@/lib/format";
import type { DashboardData } from "@/lib/data/dashboard";

/** Resumo das contas fixas do mês: quanto já foi pago e quanto falta. */
export function BillsCard({
  bills,
  currency,
  monthParam,
}: {
  bills: DashboardData["bills"];
  currency: string;
  monthParam: string | null;
}) {
  const count = bills.paidCount + bills.pendingCount + bills.autoCount;
  if (count === 0) return null;

  const total = bills.paidTotal + bills.pendingTotal + bills.autoTotal;
  const pct = total > 0 ? Math.round((bills.paidTotal / total) * 100) : 0;
  const allPaid = bills.pendingCount === 0;
  const onlyAutoLeft = allPaid && bills.autoCount > 0;

  return (
    <Link
      href={monthParam ? `/fixed?m=${monthParam}` : "/fixed"}
      className="block rounded-2xl border border-slate-200 bg-white p-5 hover:bg-slate-50"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Contas do mês</h2>
        <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Já pago</p>
          <p className="text-lg font-semibold tabular-nums text-slate-900">
            {formatCurrency(bills.paidTotal, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Falta pagar</p>
          <p className="text-lg font-semibold tabular-nums text-slate-900">
            {formatCurrency(bills.pendingTotal, currency)}
          </p>
        </div>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Contas pagas no mês"
      >
        <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${pct}%` }} />
      </div>

      {bills.autoCount > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
          <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {formatCurrency(bills.autoTotal, currency)} ainda cai em débito automático
        </p>
      )}

      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
        {bills.overdueCount > 0 ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 text-[#d03b3b]" aria-hidden />
            <span className="font-medium text-[#d03b3b]">
              {bills.overdueCount} {bills.overdueCount === 1 ? "conta atrasada" : "contas atrasadas"}
            </span>
          </>
        ) : allPaid ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-[#1c5cab]" aria-hidden />
            <span className="font-medium">
              {onlyAutoLeft
                ? "Nada a pagar à mão — o resto cai sozinho"
                : "Todas as contas do mês foram pagas"}
            </span>
          </>
        ) : bills.nextDue ? (
          <span>
            Próxima: <span className="font-medium">{bills.nextDue.name}</span> ·{" "}
            {formatDayMonth(bills.nextDue.dueDate)} ·{" "}
            {formatCurrency(bills.nextDue.amount, currency)}
          </span>
        ) : null}
      </p>
    </Link>
  );
}
