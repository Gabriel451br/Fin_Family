"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import type {
  Account,
  Category,
  FamilyMember,
  TransactionType,
} from "@/lib/types";
import type { TransactionWithDetails } from "@/lib/data/transactions";
import {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  deleteInstallmentGroupAction,
  type TransactionFormState,
} from "./actions";

const TYPE_COLOR: Record<TransactionType, string> = {
  income: "text-emerald-600",
  expense: "text-red-600",
  investment: "text-blue-600",
  transfer: "text-slate-600",
};

const TYPE_TO_CATEGORY_KIND: Record<TransactionType, string | null> = {
  income: "income",
  expense: "expense",
  investment: "investment",
  transfer: null,
};

export default function TransactionsClient({
  transactions,
  accounts,
  categories,
  members,
  currency,
  currentMemberId,
  canAdd,
  canEditAll,
  canEditOwn,
  filters,
}: {
  transactions: TransactionWithDetails[];
  accounts: Account[];
  categories: Category[];
  members: FamilyMember[];
  currency: string;
  currentMemberId: string;
  canAdd: boolean;
  canEditAll: boolean;
  canEditOwn: boolean;
  filters: Record<string, string | undefined>;
}) {
  const [modalTx, setModalTx] = useState<TransactionWithDetails | "new" | null>(null);

  function canEditTx(tx: TransactionWithDetails) {
    if (canEditAll) return true;
    return canEditOwn && tx.member_id === currentMemberId;
  }

  return (
    <div className="space-y-6">
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <FilterField label="De">
          <Input type="date" name="from" defaultValue={filters.from} />
        </FilterField>
        <FilterField label="Até">
          <Input type="date" name="to" defaultValue={filters.to} />
        </FilterField>
        <FilterField label="Tipo">
          <Select name="type" defaultValue={filters.type ?? ""}>
            <option value="">Todos</option>
            {Object.entries(TRANSACTION_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Conta">
          <Select name="account" defaultValue={filters.accountId ?? ""}>
            <option value="">Todas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Categoria">
          <Select name="category" defaultValue={filters.categoryId ?? ""}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Membro">
          <Select name="member" defaultValue={filters.memberId ?? ""}>
            <option value="">Todos</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Buscar">
          <Input name="q" placeholder="Descrição..." defaultValue={filters.search} />
        </FilterField>
        <Button type="submit" variant="outline" size="sm">Filtrar</Button>
      </form>

      {canAdd && (
        <Button onClick={() => setModalTx("new")}>
          <Plus className="h-4 w-4" /> Nova transação
        </Button>
      )}

      <Card className="p-0">
        <div className="divide-y divide-slate-100">
          {transactions.map((tx) => {
            const editable = canEditTx(tx);
            return (
              <div key={tx.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {tx.description}
                    </p>
                    {tx.installment_total && tx.installment_total > 1 && (
                      <Badge>
                        {tx.installment_number}/{tx.installment_total}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{formatDate(tx.date)}</span>
                    {tx.category_name && (
                      <>
                        <span>&middot;</span>
                        <span style={{ color: tx.category_color ?? undefined }}>
                          {tx.category_name}
                        </span>
                      </>
                    )}
                    {tx.account_name && (
                      <>
                        <span>&middot;</span>
                        <span>{tx.account_name}</span>
                      </>
                    )}
                    {tx.member_name && (
                      <>
                        <span>&middot;</span>
                        <span>{tx.member_name}</span>
                      </>
                    )}
                  </p>
                </div>
                <p className={`shrink-0 font-semibold ${TYPE_COLOR[tx.type]}`}>
                  {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
                  {formatCurrency(tx.amount, currency)}
                </p>
                {editable && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setModalTx(tx)}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (tx.installment_group_id) {
                          if (confirm("Excluir todas as parcelas dessa compra?")) {
                            deleteInstallmentGroupAction(tx.installment_group_id);
                          }
                        } else if (confirm("Excluir essa transação?")) {
                          deleteTransactionAction(tx.id);
                        }
                      }}
                      className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {transactions.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">
              Nenhuma transação encontrada para os filtros selecionados.
            </p>
          )}
        </div>
      </Card>

      <Modal
        open={modalTx !== null}
        onClose={() => setModalTx(null)}
        title={modalTx === "new" ? "Nova transação" : "Editar transação"}
      >
        {modalTx && (
          <TransactionForm
            transaction={modalTx === "new" ? null : modalTx}
            accounts={accounts}
            categories={categories}
            members={members}
            currentMemberId={currentMemberId}
            onDone={() => setModalTx(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-32">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function TransactionForm({
  transaction,
  accounts,
  categories,
  members,
  currentMemberId,
  onDone,
}: {
  transaction: TransactionWithDetails | null;
  accounts: Account[];
  categories: Category[];
  members: FamilyMember[];
  currentMemberId: string;
  onDone: () => void;
}) {
  const action = transaction
    ? updateTransactionAction.bind(null, transaction.id)
    : createTransactionAction;
  const [state, formAction, pending] = useActionState<TransactionFormState, FormData>(
    action,
    {},
  );
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");

  const categoryOptions = useMemo(() => {
    const kind = TYPE_TO_CATEGORY_KIND[type];
    if (!kind) return [];
    return categories.filter((c) => c.kind === kind);
  }, [categories, type]);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(TRANSACTION_TYPE_LABELS) as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              type === t
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {TRANSACTION_TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" defaultValue={transaction?.description} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">Valor total</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={transaction?.amount}
            required
          />
        </div>
        <div>
          <Label htmlFor="date">Data</Label>
          <Input id="date" name="date" type="date" defaultValue={transaction?.date ?? todayISO()} required />
        </div>
      </div>

      {!transaction && (
        <div>
          <Label htmlFor="installments">Parcelas</Label>
          <Input id="installments" name="installments" type="number" min="1" defaultValue={1} />
          <p className="mt-1 text-xs text-slate-500">
            O valor total será dividido igualmente entre as parcelas, uma por mês.
          </p>
        </div>
      )}

      {categoryOptions.length > 0 && (
        <div>
          <Label htmlFor="category_id">Categoria</Label>
          <Select id="category_id" name="category_id" defaultValue={transaction?.category_id ?? ""}>
            <option value="">Sem categoria</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="account_id">Conta</Label>
        <Select id="account_id" name="account_id" defaultValue={transaction?.account_id ?? accounts[0]?.id ?? ""}>
          <option value="">Sem conta</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="member_id">Responsável</Label>
        <Select id="member_id" name="member_id" defaultValue={transaction?.member_id ?? currentMemberId}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.display_name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Input id="notes" name="notes" defaultValue={transaction?.notes ?? ""} />
      </div>

      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
