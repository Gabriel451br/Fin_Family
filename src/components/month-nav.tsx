import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonthsISO,
  currentMonthStartISO,
  formatMonth,
  monthParam,
} from "@/lib/format";

export function MonthNav({
  month,
  basePath,
}: {
  month: string;
  basePath: string;
}) {
  const prev = addMonthsISO(month, -1);
  const next = addMonthsISO(month, 1);
  const isCurrent = month === currentMonthStartISO();

  return (
    <div className="flex items-center justify-between gap-2">
      <Link
        href={`${basePath}?m=${monthParam(prev)}`}
        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <div className="flex flex-col items-center">
        <span className="text-base font-semibold text-slate-900">
          {formatMonth(month)}
        </span>
        {!isCurrent && (
          <Link
            href={basePath}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Voltar para o mês atual
          </Link>
        )}
      </div>
      <Link
        href={`${basePath}?m=${monthParam(next)}`}
        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
