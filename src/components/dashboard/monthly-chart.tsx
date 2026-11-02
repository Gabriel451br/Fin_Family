"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatCompact, formatCurrency, formatMonth } from "@/lib/format";

export interface ChartPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
}

const INCOME = "#2a78d6";
const EXPENSE = "#eb6834";

const W = 320;
const H = 176;
const PAD = { top: 10, right: 4, bottom: 24, left: 36 };
const BAR_W = 14;
const BAR_GAP = 2;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * exp;
}

function barPath(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

export function MonthlyChart({
  points,
  currency,
}: {
  points: ChartPoint[];
  currency: string;
}) {
  const [active, setActive] = useState(points.length - 1);
  const current = points[active] ?? points[points.length - 1];

  const max = niceMax(Math.max(...points.flatMap((p) => [p.income, p.expense])));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const groupW = plotW / points.length;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const empty = points.every((p) => p.income === 0 && p.expense === 0);
  const balance = current.income - current.expense;

  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs" aria-live="polite">
        <div>
          <p className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: INCOME }} />
            Receitas
          </p>
          <p className="truncate text-sm font-semibold tabular-nums text-slate-900">
            {formatCurrency(current.income, currency)}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EXPENSE }} />
            Despesas
          </p>
          <p className="truncate text-sm font-semibold tabular-nums text-slate-900">
            {formatCurrency(current.expense, currency)}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Saldo</p>
          <p className="truncate text-sm font-semibold tabular-nums text-slate-900">
            {balance < 0 ? "−" : ""}
            {formatCurrency(Math.abs(balance), currency)}
          </p>
        </div>
      </div>
      <p className="mb-1 text-xs text-slate-500">{formatMonth(current.month)}</p>

      {empty ? (
        <p className="rounded-lg bg-slate-50 py-10 text-center text-sm text-slate-500">
          Sem movimentação nos últimos 6 meses.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Receitas e despesas dos últimos ${points.length} meses`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y(t) + 3}
                textAnchor="end"
                fontSize={9}
                fill="#64748b"
              >
                {t === 0 ? "0" : formatCompact(t)}
              </text>
            </g>
          ))}

          {points.map((p, i) => {
            const gx = PAD.left + i * groupW;
            const cx = gx + groupW / 2;
            const incomeH = p.income > 0 ? Math.max(2, plotH - (y(p.income) - PAD.top)) : 0;
            const expenseH = p.expense > 0 ? Math.max(2, plotH - (y(p.expense) - PAD.top)) : 0;
            const baseY = PAD.top + plotH;
            return (
              <g
                key={p.month}
                tabIndex={0}
                role="button"
                aria-label={`${formatMonth(p.month)}: receitas ${formatCurrency(p.income, currency)}, despesas ${formatCurrency(p.expense, currency)}`}
                onPointerEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="cursor-pointer outline-none"
              >
                <rect
                  x={gx + 2}
                  y={PAD.top}
                  width={groupW - 4}
                  height={plotH + PAD.bottom - 4}
                  rx={6}
                  fill={i === active ? "#f1f5f9" : "transparent"}
                />
                {incomeH > 0 && (
                  <path
                    d={barPath(cx - BAR_W - BAR_GAP / 2, baseY - incomeH, BAR_W, incomeH, 4)}
                    fill={INCOME}
                  />
                )}
                {expenseH > 0 && (
                  <path
                    d={barPath(cx + BAR_GAP / 2, baseY - expenseH, BAR_W, expenseH, 4)}
                    fill={EXPENSE}
                  />
                )}
                <text
                  x={cx}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={i === active ? 600 : 400}
                  fill={i === active ? "#0f172a" : "#64748b"}
                  className="capitalize"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: INCOME }} />
          Receitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: EXPENSE }} />
          Despesas
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Toque numa barra para ver os valores do mês.</p>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer font-medium text-slate-600">Ver em tabela</summary>
        <table className="mt-2 w-full tabular-nums">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-1 font-medium">Mês</th>
              <th className="py-1 text-right font-medium">Receitas</th>
              <th className="py-1 text-right font-medium">Despesas</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={p.month} className={cn("border-t border-slate-100", i === active && "bg-slate-50")}>
                <td className="py-1 text-slate-700">{formatMonth(p.month)}</td>
                <td className="py-1 text-right text-slate-900">{formatCurrency(p.income, currency)}</td>
                <td className="py-1 text-right text-slate-900">{formatCurrency(p.expense, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
