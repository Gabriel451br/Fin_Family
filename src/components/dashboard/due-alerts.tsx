import Link from "next/link";
import { AlertTriangle, BellRing, ChevronRight } from "lucide-react";
import { formatCurrency, formatDayMonth } from "@/lib/format";
import type { DueAlert } from "@/lib/finance";

const MAX_SHOWN = 4;

function whenText(a: DueAlert) {
  if (a.daysLeft < 0) {
    const d = -a.daysLeft;
    return `atrasada há ${d} ${d === 1 ? "dia" : "dias"}`;
  }
  if (a.daysLeft === 0) return "vence hoje";
  if (a.daysLeft === 1) return "vence amanhã";
  return `vence em ${a.daysLeft} dias (${formatDayMonth(a.dueDate)})`;
}

/** Aviso das contas a pagar à mão que já venceram ou vencem em poucos dias. */
export function DueAlerts({ alerts, currency }: { alerts: DueAlert[]; currency: string }) {
  if (alerts.length === 0) return null;

  const overdue = alerts.filter((a) => a.daysLeft < 0).length;
  const shown = alerts.slice(0, MAX_SHOWN);
  const more = alerts.length - shown.length;

  return (
    <Link
      href="/fixed"
      className={`block rounded-2xl border p-4 ${
        overdue > 0 ? "border-red-200 bg-red-50/70" : "border-amber-200 bg-amber-50/70"
      }`}
      aria-label="Avisos de vencimento"
    >
      <div className="flex items-center gap-2">
        {overdue > 0 ? (
          <AlertTriangle className="h-4 w-4 text-[#d03b3b]" aria-hidden />
        ) : (
          <BellRing className="h-4 w-4 text-amber-700" aria-hidden />
        )}
        <h2 className="text-sm font-semibold text-slate-900">
          {overdue > 0
            ? `${overdue} ${overdue === 1 ? "conta atrasada" : "contas atrasadas"}`
            : "Contas perto de vencer"}
          {overdue > 0 && alerts.length > overdue ? " e outras perto de vencer" : ""}
        </h2>
        <ChevronRight className="ml-auto h-4 w-4 text-slate-400" aria-hidden />
      </div>
      <ul className="mt-2 space-y-1.5">
        {shown.map((a) => (
          <li key={a.id} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-slate-900">
              <span className="font-medium">{a.name}</span>{" "}
              <span
                className={`text-xs font-medium ${
                  a.daysLeft < 0 ? "text-[#d03b3b]" : "text-amber-700"
                }`}
              >
                · {whenText(a)}
              </span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-700">
              {formatCurrency(a.amount, currency)}
            </span>
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p className="mt-1.5 text-xs text-slate-500">e mais {more} — toque para ver tudo</p>
      )}
    </Link>
  );
}
