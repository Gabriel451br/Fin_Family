import { formatCurrency } from "@/lib/format";
import type { ExpenseSlice } from "@/lib/data/dashboard";

export function ExpenseBreakdown({
  slices,
  currency,
}: {
  slices: ExpenseSlice[];
  currency: string;
}) {
  const total = slices.reduce((sum, s) => sum + s.amount, 0);
  if (total <= 0) {
    return (
      <p className="rounded-lg bg-slate-50 py-8 text-center text-sm text-slate-500">
        Nenhuma despesa registrada neste mês ainda.
      </p>
    );
  }
  const max = Math.max(...slices.map((s) => s.amount));

  return (
    <ul className="space-y-3">
      {slices.map((s) => (
        <li key={s.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-slate-800">{s.name}</span>
            <span className="shrink-0 tabular-nums text-slate-900">
              <span className="font-semibold">{formatCurrency(s.amount, currency)}</span>
              <span className="ml-2 text-xs text-slate-500">
                {Math.round((s.amount / total) * 100)}%
              </span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#eb6834]"
              style={{ width: `${Math.max(2, (s.amount / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
