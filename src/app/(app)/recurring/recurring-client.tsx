"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2, Pause, Play, CheckCircle2 } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS, RECURRENCE_FREQUENCY_LABELS } from "@/lib/constants";
import { projectOccurrences } from "@/lib/recurrence";
import type { Account, Category, RecurrenceFrequency, TransactionType } from "@/lib/types";
import type { RecurringRuleWithDetails } from "@/lib/data/recurring";
import {
  createRecurringRuleAction,
  toggleRecurringRuleAction,
  deleteRecurringRuleAction,
  confirmOccurrenceAction,
  type RecurringFormState,
} from "./actions";

export default function RecurringClient({
  rules,
  accounts,
  categories,
  currency,
  canManage,
}: {
  rules: RecurringRuleWithDetails[];
  accounts: Account[];
  categories: Category[];
  currency: string;
  canManage: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const active = rules.filter((r) => r.is_active);
  const inactive = rules.filter((r) => !r.is_active);

  return (
    <div className="space-y-6">
      {canManage && (
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Nova recorrência
        </Button>
      )}

      <div className="space-y-4">
        {active.map((rule) => (
          <RuleCard key={rule.id} rule={rule} currency={currency} canManage={canManage} />
        ))}
        {active.length === 0 && (
          <Card className="text-center text-sm text-slate-500">
            Nenhuma despesa ou receita recorrente cadastrada.
          </Card>
        )}
      </div>

      {inactive.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Pausadas ({inactive.length})
          </summary>
          <div className="mt-4 space-y-4">
            {inactive.map((rule) => (
              <RuleCard key={rule.id} rule={rule} currency={currency} canManage={canManage} />
            ))}
          </div>
        </details>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova recorrência">
        <RecurringForm accounts={accounts} categories={categories} onDone={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}

function RuleCard({
  rule,
  currency,
  canManage,
}: {
  rule: RecurringRuleWithDetails;
  currency: string;
  canManage: boolean;
}) {
  const occurrences = projectOccurrences(rule, 3);

  return (
    <Card className={!rule.is_active ? "opacity-60" : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{rule.description}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge color={rule.type === "expense" ? "red" : rule.type === "income" ? "green" : "blue"}>
              {TRANSACTION_TYPE_LABELS[rule.type]}
            </Badge>
            <Badge>{RECURRENCE_FREQUENCY_LABELS[rule.frequency]}</Badge>
            {rule.category_name && <Badge color="violet">{rule.category_name}</Badge>}
            {rule.account_name && <Badge>{rule.account_name}</Badge>}
          </div>
        </div>
        <p className="text-lg font-bold text-slate-900">
          {formatCurrency(rule.amount, currency)}
        </p>
      </div>

      {rule.is_active && occurrences.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Próximos lançamentos esperados
          </p>
          <div className="space-y-2">
            {occurrences.map((date) => (
              <div key={date.toISOString()} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{formatDate(date)}</span>
                <button
                  onClick={() =>
                    confirmOccurrenceAction(rule.id, date.toISOString().slice(0, 10))
                  }
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar lançamento
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {canManage && (
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleRecurringRuleAction(rule.id, !rule.is_active)}
          >
            {rule.is_active ? (
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
              if (confirm("Excluir essa recorrência?")) deleteRecurringRuleAction(rule.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
      )}
    </Card>
  );
}

function RecurringForm({
  accounts,
  categories,
  onDone,
}: {
  accounts: Account[];
  categories: Category[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<RecurringFormState, FormData>(
    createRecurringRuleAction,
    {},
  );
  const [type, setType] = useState<TransactionType>("expense");

  const categoryOptions = categories.filter((c) => c.kind === type);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" placeholder="Ex: Aluguel, Netflix, Salário" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">Valor</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
        </div>
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
            <option value="investment">Investimento</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="frequency">Frequência</Label>
          <Select id="frequency" name="frequency" defaultValue="monthly">
            {Object.entries(RECURRENCE_FREQUENCY_LABELS).map(([v, l]) => (
              <option key={v} value={v as RecurrenceFrequency}>{l}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="interval_count">Repetir a cada</Label>
          <Input id="interval_count" name="interval_count" type="number" min="1" defaultValue={1} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="start_date">Início</Label>
          <Input id="start_date" name="start_date" type="date" defaultValue={todayISO()} required />
        </div>
        <div>
          <Label htmlFor="end_date">Término (opcional)</Label>
          <Input id="end_date" name="end_date" type="date" />
        </div>
      </div>
      {categoryOptions.length > 0 && (
        <div>
          <Label htmlFor="category_id">Categoria</Label>
          <Select id="category_id" name="category_id">
            <option value="">Sem categoria</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="account_id">Conta</Label>
        <Select id="account_id" name="account_id" defaultValue={accounts[0]?.id ?? ""}>
          <option value="">Sem conta</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
