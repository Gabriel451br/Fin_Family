"use client";

import Link from "next/link";
import { CheckCircle2, TrendingUp, TrendingDown, PiggyBank, Wallet } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { GOAL_KIND_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import type { Account, GoalKind } from "@/lib/types";
import type { BudgetWithCategory } from "@/lib/data/budgets";
import type { GoalWithCategory } from "@/lib/data/goals";
import type { RecurringRuleWithDetails } from "@/lib/data/recurring";
import type { TransactionWithDetails, MonthlySummary } from "@/lib/data/transactions";
import { confirmOccurrenceAction } from "../recurring/actions";

const LIMIT_KIND: GoalKind[] = ["expense_limit"];

export default function DashboardClient({
  currency,
  netWorth,
  summary,
  accounts,
  balances,
  budgets,
  spend,
  goals,
  upcoming,
  recentTx,
}: {
  currency: string;
  netWorth: number;
  summary: MonthlySummary;
  accounts: Account[];
  balances: Record<string, number>;
  budgets: BudgetWithCategory[];
  spend: Record<string, number>;
  goals: Array<GoalWithCategory & { currentAmount: number }>;
  upcoming: Array<{ rule: RecurringRuleWithDetails; date: Date }>;
  recentTx: TransactionWithDetails[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Patrimônio líquido"
          value={formatCurrency(netWorth, currency)}
          color="text-slate-900"
        />
        <StatCard
          icon={TrendingUp}
          label="Receitas do mês"
          value={formatCurrency(summary.income, currency)}
          color="text-emerald-600"
        />
        <StatCard
          icon={TrendingDown}
          label="Despesas do mês"
          value={formatCurrency(summary.expense, currency)}
          color="text-red-600"
        />
        <StatCard
          icon={PiggyBank}
          label="Investido no mês"
          value={formatCurrency(summary.investment, currency)}
          color="text-blue-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Contas</h2>
            <Link href="/accounts" className="text-xs font-medium text-blue-600 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {accounts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                  <span className="text-slate-700">{a.name}</span>
                </div>
                <span className="font-medium text-slate-900">
                  {formatCurrency(balances[a.id] ?? 0, currency)}
                </span>
              </div>
            ))}
            {accounts.length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma conta cadastrada.</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Orçamentos do mês</h2>
            <Link href="/budgets" className="text-xs font-medium text-blue-600 hover:underline">
              Gerenciar
            </Link>
          </div>
          <div className="space-y-3">
            {budgets.slice(0, 5).map((b) => {
              const spent = spend[b.category_id] ?? 0;
              const pct = Math.min(100, (spent / Number(b.amount_limit)) * 100);
              const over = spent > Number(b.amount_limit);
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{b.category_name}</span>
                    <span>
                      {formatCurrency(spent, currency)} / {formatCurrency(b.amount_limit, currency)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", over ? "bg-red-500" : "bg-blue-600")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {budgets.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum orçamento definido para este mês.</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Metas</h2>
            <Link href="/goals" className="text-xs font-medium text-blue-600 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {goals.map((g) => {
              const isLimit = LIMIT_KIND.includes(g.kind);
              const pct = Math.min(100, (g.currentAmount / Number(g.target_amount)) * 100);
              const over = isLimit && g.currentAmount > Number(g.target_amount);
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>
                      {g.name} <Badge className="ml-1">{GOAL_KIND_LABELS[g.kind]}</Badge>
                    </span>
                    <span>
                      {formatCurrency(g.currentAmount, currency)} / {formatCurrency(g.target_amount, currency)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", over ? "bg-red-500" : "bg-emerald-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma meta ativa.</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Próximos lançamentos</h2>
            <Link href="/recurring" className="text-xs font-medium text-blue-600 hover:underline">
              Ver recorrentes
            </Link>
          </div>
          <div className="space-y-3">
            {upcoming.map(({ rule, date }) => (
              <div key={`${rule.id}-${date.toISOString()}`} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-slate-700">{rule.description}</p>
                  <p className="text-xs text-slate-400">{formatDate(date)}</p>
                </div>
                <button
                  onClick={() => confirmOccurrenceAction(rule.id, date.toISOString().slice(0, 10))}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar
                </button>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma recorrência cadastrada.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Últimas transações</h2>
          <Link href="/transactions" className="text-xs font-medium text-blue-600 hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentTx.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="text-slate-800">{tx.description}</p>
                <p className="text-xs text-slate-400">
                  {formatDate(tx.date)} &middot; {TRANSACTION_TYPE_LABELS[tx.type]}
                </p>
              </div>
              <span
                className={cn(
                  "font-medium",
                  tx.type === "income"
                    ? "text-emerald-600"
                    : tx.type === "expense"
                      ? "text-red-600"
                      : "text-blue-600",
                )}
              >
                {formatCurrency(tx.amount, currency)}
              </span>
            </div>
          ))}
          {recentTx.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">Nenhuma transação ainda.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className={cn("mt-2 text-xl font-bold", color)}>{value}</p>
    </Card>
  );
}
