"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select, Input, FieldError } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatMonth, addMonthsISO } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";
import type { BudgetWithCategory } from "@/lib/data/budgets";
import {
  upsertBudgetAction,
  deleteBudgetAction,
  copyFromPreviousMonthAction,
  type BudgetFormState,
} from "./actions";

export default function BudgetsClient({
  periodMonth,
  budgets,
  spend,
  categories,
  currency,
  canManage,
}: {
  periodMonth: string;
  budgets: BudgetWithCategory[];
  spend: Record<string, number>;
  categories: Category[];
  currency: string;
  canManage: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const usedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = categories.filter((c) => !usedCategoryIds.has(c.id));

  const prevMonth = addMonthsISO(periodMonth, -1);
  const nextMonth = addMonthsISO(periodMonth, 1);

  const totalLimit = budgets.reduce((sum, b) => sum + Number(b.amount_limit), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (spend[b.category_id] ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/budgets?month=${prevMonth}`} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="w-40 text-center text-sm font-medium capitalize text-slate-700">
            {formatMonth(periodMonth)}
          </span>
          <Link href={`/budgets?month=${nextMonth}`} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyFromPreviousMonthAction(prevMonth, periodMonth)}
            >
              <Copy className="h-3.5 w-3.5" /> Copiar mês anterior
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Novo orçamento
            </Button>
          </div>
        )}
      </div>

      <Card>
        <p className="text-sm text-slate-500">Total orçado vs. gasto no mês</p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent, currency)}</p>
          <p className="text-sm text-slate-400">de {formatCurrency(totalLimit, currency)}</p>
        </div>
        <ProgressBar spent={totalSpent} limit={totalLimit} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {budgets.map((budget) => {
          const spent = spend[budget.category_id] ?? 0;
          return (
            <Card key={budget.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: budget.category_color }}
                  />
                  <p className="font-medium text-slate-900">{budget.category_name}</p>
                </div>
                {canManage && (
                  <button
                    onClick={() => {
                      if (confirm("Remover esse orçamento?")) deleteBudgetAction(budget.id);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-lg font-bold text-slate-900">{formatCurrency(spent, currency)}</p>
                <p className="text-sm text-slate-400">
                  de {formatCurrency(budget.amount_limit, currency)}
                </p>
              </div>
              <ProgressBar spent={spent} limit={Number(budget.amount_limit)} />
            </Card>
          );
        })}
        {budgets.length === 0 && (
          <Card className="col-span-full text-center text-sm text-slate-500">
            Nenhum orçamento definido para este mês.
          </Card>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo orçamento">
        <BudgetForm
          periodMonth={periodMonth}
          categories={availableCategories}
          onDone={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

function ProgressBar({ spent, limit }: { spent: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = limit > 0 && spent > limit;
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn("h-full rounded-full", over ? "bg-red-500" : "bg-blue-600")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function BudgetForm({
  periodMonth,
  categories,
  onDone,
}: {
  periodMonth: string;
  categories: Category[];
  onDone: () => void;
}) {
  const action = upsertBudgetAction.bind(null, periodMonth);
  const [state, formAction, pending] = useActionState<BudgetFormState, FormData>(action, {});

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="category_id">Categoria</Label>
        <Select id="category_id" name="category_id" required>
          <option value="">Selecione...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="amount_limit">Limite mensal</Label>
        <Input id="amount_limit" name="amount_limit" type="number" step="0.01" min="0.01" required />
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
