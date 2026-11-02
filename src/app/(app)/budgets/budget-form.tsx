"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Label, FieldError } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveBudgetAction } from "./actions";

interface Row {
  id: string;
  name: string;
  color: string;
  limit: number;
}

export function BudgetForm({ rows, canEdit }: { rows: Row[]; canEdit: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(formData: FormData) {
    const result = await saveBudgetAction(formData);
    if (result.error) {
      setError(result.error);
      setSaved(false);
      return;
    }
    setError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form action={submit} className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Limite mensal por categoria</h2>
      <p className="mt-1 text-xs text-slate-500">
        Vale a partir deste mês e se repete nos próximos, até você mudar. Deixe em branco para não
        ter limite.
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
          Cadastre categorias de despesa primeiro em “Categorias”.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="grid grid-cols-[1fr_9rem] items-center gap-3">
              <Label
                htmlFor={`limit_${row.id}`}
                className="mb-0 flex items-center gap-2 truncate"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span className="truncate">{row.name}</span>
              </Label>
              <MoneyInput
                id={`limit_${row.id}`}
                name={`limit_${row.id}`}
                disabled={!canEdit}
                defaultValue={row.limit > 0 ? row.limit.toFixed(2).replace(".", ",") : ""}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2">
        <FieldError>{error}</FieldError>
        {saved && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-[#006300]">
            <Check className="h-4 w-4" /> Orçamento salvo
          </p>
        )}
        {canEdit && rows.length > 0 ? (
          <SubmitButton size="lg" className="w-full">
            Salvar orçamento
          </SubmitButton>
        ) : (
          !canEdit && (
            <p className="text-xs text-slate-500">
              Só administradores podem alterar o orçamento.
            </p>
          )
        )}
      </div>
    </form>
  );
}
