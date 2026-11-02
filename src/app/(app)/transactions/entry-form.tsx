"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { todayISO } from "@/lib/format";
import type { FlowType } from "@/lib/finance";
import { createCategoryAction } from "../categories/actions";
import { saveTransactionAction } from "./actions";

export interface EntryCategory {
  id: string;
  name: string;
  color: string;
  kind: string;
}

export interface EntryTransaction {
  id: string;
  type: FlowType;
  amount: string;
  date: string;
  description: string;
  category_id: string | null;
  member_id: string | null;
}

export function EntryForm({
  categories,
  members,
  currentMemberId,
  canManageCategories,
  transaction,
  onSaved,
}: {
  categories: EntryCategory[];
  members: { id: string; display_name: string }[];
  currentMemberId: string;
  canManageCategories: boolean;
  transaction?: EntryTransaction;
  onSaved?: () => void;
}) {
  const [type, setType] = useState<FlowType>(transaction?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [extra, setExtra] = useState<EntryCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addPending, setAddPending] = useState(false);

  const options = [...categories, ...extra].filter((c) => c.kind === type);

  async function submit(formData: FormData) {
    const result = await saveTransactionAction(transaction?.id ?? null, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    if (!transaction) {
      setFormKey((k) => k + 1);
      setCategoryId("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    onSaved?.();
  }

  async function addCategory() {
    setAddPending(true);
    setAddError(null);
    const result = await createCategoryAction(type, newName);
    setAddPending(false);
    if (result.error || !result.category) {
      setAddError(result.error ?? "Não foi possível criar a categoria.");
      return;
    }
    setExtra((list) => [...list, result.category!]);
    setCategoryId(result.category.id);
    setNewName("");
    setAdding(false);
  }

  return (
    <form key={formKey} action={submit} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="category_id" value={categoryId} />

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de lançamento">
        {(
          [
            ["expense", "Despesa", "bg-[#eb6834]"],
            ["income", "Receita", "bg-[#2a78d6]"],
          ] as const
        ).map(([value, label, dot]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setType(value);
              setCategoryId("");
            }}
            aria-pressed={type === value}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors",
              type === value
                ? "border-slate-900 bg-white text-slate-900"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white",
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", dot)} />
            {label}
          </button>
        ))}
      </div>

      <div>
        <Label htmlFor="amount">Valor</Label>
        <MoneyInput
          id="amount"
          name="amount"
          size="lg"
          required
          defaultValue={transaction ? Number(transaction.amount).toFixed(2).replace(".", ",") : ""}
        />
      </div>

      <div>
        <Label>Categoria</Label>
        <div className="flex flex-wrap gap-2">
          {options.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(categoryId === c.id ? "" : c.id)}
              aria-pressed={categoryId === c.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                categoryId === c.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              <span
                className="h-2 w-2 rounded-full ring-1 ring-white/60"
                style={{ backgroundColor: c.color }}
              />
              {c.name}
            </button>
          ))}
          {canManageCategories && !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" /> Nova
            </button>
          )}
        </div>
        {options.length === 0 && !adding && (
          <p className="mt-1 text-xs text-slate-500">
            Nenhuma categoria ainda. {canManageCategories ? "Crie a primeira em “Nova”." : ""}
          </p>
        )}
        {adding && (
          <div className="mt-2 flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da categoria"
              maxLength={40}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newName.trim()) addCategory();
                }
              }}
            />
            <button
              type="button"
              onClick={addCategory}
              disabled={addPending || !newName.trim()}
              className="shrink-0 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white disabled:opacity-40"
            >
              {addPending ? "..." : "Criar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setAddError(null);
              }}
              className="shrink-0 px-1 text-sm text-slate-500"
            >
              Cancelar
            </button>
          </div>
        )}
        <FieldError>{addError}</FieldError>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={transaction?.date ?? todayISO()}
          />
        </div>
        {members.length > 1 ? (
          <div>
            <Label htmlFor="member_id">Quem</Label>
            <Select
              id="member_id"
              name="member_id"
              defaultValue={transaction?.member_id ?? currentMemberId}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <input type="hidden" name="member_id" value={currentMemberId} />
        )}
      </div>

      <div>
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input
          id="description"
          name="description"
          maxLength={80}
          placeholder={type === "expense" ? "Ex: compras da semana" : "Ex: venda de móvel"}
          defaultValue={transaction?.description ?? ""}
        />
      </div>

      <FieldError>{error}</FieldError>
      {saved && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-[#006300]">
          <Check className="h-4 w-4" /> Lançamento salvo
        </p>
      )}
      <SubmitButton size="lg" className="w-full">
        {transaction ? "Salvar alterações" : type === "expense" ? "Lançar despesa" : "Lançar receita"}
      </SubmitButton>
    </form>
  );
}
