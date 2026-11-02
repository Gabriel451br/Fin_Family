"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDayMonth } from "@/lib/format";
import { cn } from "@/lib/cn";
import { EntryForm, type EntryCategory, type EntryTransaction } from "./entry-form";
import { deleteTransactionAction } from "./actions";

export interface ListTransaction extends EntryTransaction {
  category_name: string | null;
  category_color: string | null;
  member_name: string | null;
}

export function TransactionList({
  transactions,
  categories,
  members,
  currency,
  currentMemberId,
  canEditAll,
  canEditOwn,
  canManageCategories,
}: {
  transactions: ListTransaction[];
  categories: EntryCategory[];
  members: { id: string; display_name: string }[];
  currency: string;
  currentMemberId: string;
  canEditAll: boolean;
  canEditOwn: boolean;
  canManageCategories: boolean;
}) {
  const [editing, setEditing] = useState<ListTransaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canEdit = (t: ListTransaction) =>
    canEditAll || (canEditOwn && t.member_id === currentMemberId);

  const groups = new Map<string, ListTransaction[]>();
  for (const t of transactions) {
    groups.set(t.date, [...(groups.get(t.date) ?? []), t]);
  }

  async function remove(t: ListTransaction) {
    if (!confirm("Excluir este lançamento?")) return;
    const result = await deleteTransactionAction(t.id);
    if (result.error) setDeleteError(result.error);
    else setEditing(null);
  }

  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Nenhum lançamento neste mês ainda.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([date, items]) => (
        <section key={date}>
          <h3 className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            {formatDayMonth(date)}
          </h3>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {items.map((t) => {
              const interactive = canEdit(t);
              const Row = interactive ? "button" : "div";
              return (
                <li key={t.id}>
                  <Row
                    {...(interactive
                      ? { type: "button" as const, onClick: () => setEditing(t) }
                      : {})}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left",
                      interactive && "hover:bg-slate-50",
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: t.category_color ?? "#cbd5e1" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {t.description}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {t.category_name ?? "Sem categoria"}
                        {members.length > 1 && t.member_name ? ` · ${t.member_name}` : ""}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        t.type === "income" ? "text-[#006300]" : "text-slate-900",
                      )}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {formatCurrency(t.amount, currency)}
                    </span>
                  </Row>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Editar lançamento"
      >
        {editing && (
          <div className="space-y-4">
            <EntryForm
              key={editing.id}
              transaction={editing}
              categories={categories}
              members={members}
              currentMemberId={currentMemberId}
              canManageCategories={canManageCategories}
              onSaved={() => setEditing(null)}
            />
            {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
            <button
              type="button"
              onClick={() => remove(editing)}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Excluir lançamento
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
