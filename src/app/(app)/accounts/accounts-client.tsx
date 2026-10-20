"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_COLORS } from "@/lib/constants";
import type { Account, AccountType } from "@/lib/types";
import {
  createAccountAction,
  updateAccountAction,
  toggleAccountArchivedAction,
  type AccountFormState,
} from "./actions";

export default function AccountsClient({
  accounts,
  balances,
  currency,
  canManage,
}: {
  accounts: Account[];
  balances: Record<string, number>;
  currency: string;
  canManage: boolean;
}) {
  const [modalAccount, setModalAccount] = useState<Account | "new" | null>(null);

  const active = accounts.filter((a) => !a.is_archived);
  const archived = accounts.filter((a) => a.is_archived);

  return (
    <div className="space-y-6">
      {canManage && (
        <Button onClick={() => setModalAccount("new")}>
          <Plus className="h-4 w-4" /> Nova conta
        </Button>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            balance={balances[account.id] ?? 0}
            currency={currency}
            canManage={canManage}
            onEdit={() => setModalAccount(account)}
            onArchive={() => toggleAccountArchivedAction(account.id, true)}
          />
        ))}
      </div>

      {active.length === 0 && (
        <Card className="text-center text-sm text-slate-500">
          Nenhuma conta cadastrada ainda.
        </Card>
      )}

      {archived.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Contas arquivadas ({archived.length})
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                balance={balances[account.id] ?? 0}
                currency={currency}
                canManage={canManage}
                onEdit={() => setModalAccount(account)}
                onArchive={() => toggleAccountArchivedAction(account.id, false)}
                archived
              />
            ))}
          </div>
        </details>
      )}

      <Modal
        open={modalAccount !== null}
        onClose={() => setModalAccount(null)}
        title={modalAccount === "new" ? "Nova conta" : "Editar conta"}
      >
        {modalAccount && (
          <AccountForm
            account={modalAccount === "new" ? null : modalAccount}
            onDone={() => setModalAccount(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function AccountCard({
  account,
  balance,
  currency,
  canManage,
  onEdit,
  onArchive,
  archived,
}: {
  account: Account;
  balance: number;
  currency: string;
  canManage: boolean;
  onEdit: () => void;
  onArchive: () => void;
  archived?: boolean;
}) {
  return (
    <Card className={archived ? "opacity-60" : undefined}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-900">{account.name}</p>
          <Badge color="slate" className="mt-1">
            {ACCOUNT_TYPE_LABELS[account.type]}
          </Badge>
          {account.institution && (
            <p className="mt-1 text-xs text-slate-500">{account.institution}</p>
          )}
        </div>
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: account.color }}
        />
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">
        {formatCurrency(balance, currency)}
      </p>
      {canManage && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button size="sm" variant="ghost" onClick={onArchive}>
            {archived ? (
              <>
                <ArchiveRestore className="h-3.5 w-3.5" /> Reativar
              </>
            ) : (
              <>
                <Archive className="h-3.5 w-3.5" /> Arquivar
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

function AccountForm({
  account,
  onDone,
}: {
  account: Account | null;
  onDone: () => void;
}) {
  const action = account
    ? updateAccountAction.bind(null, account.id)
    : createAccountAction;
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(
    action,
    {},
  );
  const [color, setColor] = useState(account?.color ?? ACCOUNT_COLORS[0]);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={account?.name} required />
      </div>
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" name="type" defaultValue={account?.type ?? "checking"}>
          {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value as AccountType}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="institution">Instituição (opcional)</Label>
        <Input id="institution" name="institution" defaultValue={account?.institution ?? ""} />
      </div>
      <div>
        <Label htmlFor="initial_balance">Saldo inicial</Label>
        <Input
          id="initial_balance"
          name="initial_balance"
          type="number"
          step="0.01"
          defaultValue={account?.initial_balance ?? "0"}
          required
        />
      </div>
      <div>
        <Label>Cor</Label>
        <input type="hidden" name="color" value={color} />
        <div className="flex gap-2">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full ring-offset-2"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
              }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
