"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input, Label, FieldError } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCurrency } from "@/lib/format";
import type { FixedItem, FlowType } from "@/lib/finance";
import { removeFixedAction, saveFixedAction } from "./actions";

type Editing = { item: FixedItem | null; type: FlowType } | null;

const SECTIONS: Array<{ type: FlowType; title: string; empty: string; dot: string }> = [
  {
    type: "income",
    title: "Receitas fixas",
    empty: "Ex: salário, aluguel recebido, pensão.",
    dot: "bg-[#2a78d6]",
  },
  {
    type: "expense",
    title: "Despesas fixas",
    empty: "Ex: aluguel, condomínio, internet, escola, plano de saúde.",
    dot: "bg-[#eb6834]",
  },
];

export function FixedClient({
  items,
  currency,
  canManage,
}: {
  items: FixedItem[];
  currency: string;
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<Editing>(null);

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => {
        const list = items.filter((i) => i.type === section.type);
        const total = list.reduce((sum, i) => sum + i.amount, 0);
        return (
          <section key={section.type} className="rounded-xl border border-slate-200 bg-white">
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${section.dot}`} />
                <h2 className="text-sm font-semibold text-slate-900">{section.title}</h2>
              </div>
              <p className="text-sm tabular-nums text-slate-600">
                Total/mês{" "}
                <span className="font-semibold text-slate-900">
                  {formatCurrency(total, currency)}
                </span>
              </p>
            </header>

            {list.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                Nada cadastrado. {section.empty}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {list.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => setEditing({ item, type: item.type })}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left enabled:hover:bg-slate-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <span className="text-[9px] uppercase leading-none text-slate-500">dia</span>
                        <span className="text-sm font-semibold leading-tight">{item.dayOfMonth}</span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                        {item.description}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                        {formatCurrency(item.amount, currency)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {canManage && (
              <div className="border-t border-slate-100 p-3">
                <button
                  type="button"
                  onClick={() => setEditing({ item: null, type: section.type })}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar {section.type === "income" ? "receita fixa" : "despesa fixa"}
                </button>
              </div>
            )}
          </section>
        );
      })}

      <p className="px-1 text-xs text-slate-500">
        Os itens fixos entram sozinhos no Painel a partir do dia do vencimento — não precisa
        lançar de novo todo mês. Ao mudar um valor, o novo valor vale para o mês atual em diante.
      </p>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing?.item
            ? "Editar item fixo"
            : editing?.type === "income"
              ? "Nova receita fixa"
              : "Nova despesa fixa"
        }
      >
        {editing && (
          <FixedForm
            key={editing.item?.id ?? `new-${editing.type}`}
            item={editing.item}
            type={editing.type}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function FixedForm({
  item,
  type,
  onDone,
}: {
  item: FixedItem | null;
  type: FlowType;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    const result = await saveFixedAction(item?.id ?? null, formData);
    if (result.error) setError(result.error);
    else onDone();
  }

  async function remove() {
    if (!item) return;
    if (!confirm(`Remover "${item.description}"? Os meses anteriores continuam no histórico.`)) {
      return;
    }
    const result = await removeFixedAction(item.id);
    if (result.error) setError(result.error);
    else onDone();
  }

  return (
    <form action={submit} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      <div>
        <Label htmlFor="description">Nome</Label>
        <Input
          id="description"
          name="description"
          required
          maxLength={60}
          defaultValue={item?.description}
          placeholder={type === "income" ? "Ex: Salário" : "Ex: Aluguel"}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">Valor por mês</Label>
          <MoneyInput
            id="amount"
            name="amount"
            required
            defaultValue={item ? item.amount.toFixed(2).replace(".", ",") : ""}
          />
        </div>
        <div>
          <Label htmlFor="day_of_month">Dia do mês</Label>
          <Input
            id="day_of_month"
            name="day_of_month"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            required
            defaultValue={item?.dayOfMonth ?? 5}
          />
        </div>
      </div>
      <FieldError>{error}</FieldError>
      <SubmitButton size="lg" className="w-full">
        Salvar
      </SubmitButton>
      {item && (
        <button
          type="button"
          onClick={remove}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" /> Remover
        </button>
      )}
    </form>
  );
}
