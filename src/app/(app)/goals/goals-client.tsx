"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, Pause, Play } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/format";
import { GOAL_KIND_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { Category, GoalKind } from "@/lib/types";
import type { GoalWithCategory } from "@/lib/data/goals";
import {
  createGoalAction,
  setGoalActiveAction,
  deleteGoalAction,
  type GoalFormState,
} from "./actions";

type GoalWithProgress = GoalWithCategory & { currentAmount: number };

const LIMIT_KIND: GoalKind[] = ["expense_limit"];

export default function GoalsClient({
  goals,
  categories,
  currency,
  canManage,
}: {
  goals: GoalWithProgress[];
  categories: Category[];
  currency: string;
  canManage: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const active = goals.filter((g) => g.is_active);
  const inactive = goals.filter((g) => !g.is_active);

  return (
    <div className="space-y-6">
      {canManage && (
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Nova meta
        </Button>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {active.map((goal) => (
          <GoalCard key={goal.id} goal={goal} currency={currency} canManage={canManage} />
        ))}
        {active.length === 0 && (
          <Card className="col-span-full text-center text-sm text-slate-500">
            Nenhuma meta ativa. Crie metas de renda, economia ou investimento.
          </Card>
        )}
      </div>

      {inactive.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Pausadas ({inactive.length})
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {inactive.map((goal) => (
              <GoalCard key={goal.id} goal={goal} currency={currency} canManage={canManage} />
            ))}
          </div>
        </details>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova meta">
        <GoalForm categories={categories} onDone={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}

function GoalCard({
  goal,
  currency,
  canManage,
}: {
  goal: GoalWithProgress;
  currency: string;
  canManage: boolean;
}) {
  const isLimit = LIMIT_KIND.includes(goal.kind);
  const pct = goal.target_amount
    ? Math.min(100, (goal.currentAmount / Number(goal.target_amount)) * 100)
    : 0;
  const over = isLimit && goal.currentAmount > Number(goal.target_amount);
  const reached = !isLimit && goal.currentAmount >= Number(goal.target_amount);

  return (
    <Card className={!goal.is_active ? "opacity-60" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{goal.name}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge color="violet">{GOAL_KIND_LABELS[goal.kind]}</Badge>
            {goal.category_name && <Badge>{goal.category_name}</Badge>}
            {reached && <Badge color="green">Atingida!</Badge>}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-lg font-bold text-slate-900">
          {formatCurrency(goal.currentAmount, currency)}
        </p>
        <p className="text-sm text-slate-400">
          {isLimit ? "limite" : "meta"} {formatCurrency(goal.target_amount, currency)}
        </p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full",
            over ? "bg-red-500" : reached ? "bg-emerald-500" : "bg-blue-600",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {goal.target_date && (
        <p className="mt-2 text-xs text-slate-500">Prazo: {formatDate(goal.target_date)}</p>
      )}
      {goal.notes && <p className="mt-2 text-sm text-slate-600">{goal.notes}</p>}

      {canManage && (
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setGoalActiveAction(goal.id, !goal.is_active)}
          >
            {goal.is_active ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pausar
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Reativar
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("Excluir essa meta?")) deleteGoalAction(goal.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
      )}
    </Card>
  );
}

function GoalForm({
  categories,
  onDone,
}: {
  categories: Category[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<GoalFormState, FormData>(
    createGoalAction,
    {},
  );

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="name">Nome da meta</Label>
        <Input id="name" name="name" placeholder="Ex: Reserva de emergência" required />
      </div>
      <div>
        <Label htmlFor="kind">Tipo</Label>
        <Select id="kind" name="kind" defaultValue="savings_target">
          {Object.entries(GOAL_KIND_LABELS).map(([v, l]) => (
            <option key={v} value={v as GoalKind}>{l}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="target_amount">Valor alvo</Label>
          <Input id="target_amount" name="target_amount" type="number" step="0.01" min="0.01" required />
        </div>
        <div>
          <Label htmlFor="target_date">Prazo (opcional)</Label>
          <Input id="target_date" name="target_date" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="category_id">Categoria (opcional)</Label>
        <Select id="category_id" name="category_id">
          <option value="">Todas / geral</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
