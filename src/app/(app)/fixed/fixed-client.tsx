"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCurrency, formatDayMonth, formatMonth } from "@/lib/format";
import type {
  Bill,
  BillStatus,
  BillSummary,
  FixedFrequency,
  FixedItem,
  FlowType,
} from "@/lib/finance";
import {
  markPaidAction,
  removeFixedAction,
  saveFixedAction,
  undoPaidAction,
} from "./actions";

type Editing = { item: FixedItem | null; type: FlowType } | null;

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const STATUS_STYLE: Record<BillStatus, string> = {
  paid: "text-[#1c5cab]",
  overdue: "text-[#d03b3b]",
  today: "text-amber-700",
  upcoming: "text-slate-500",
};

function dueText(bill: Bill) {
  return `dia ${Number(bill.dueDate.slice(8, 10))}`;
}

function StatusLine({ bill }: { bill: Bill }) {
  const cls = `flex items-center gap-1 text-xs font-medium ${STATUS_STYLE[bill.status]}`;
  if (bill.status === "paid") {
    return (
      <span className={cls}>
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Paga em{" "}
        {formatDayMonth(bill.paidDate ?? bill.dueDate)}
      </span>
    );
  }
  if (bill.status === "overdue") {
    return (
      <span className={cls}>
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Atrasada · venceu{" "}
        {formatDayMonth(bill.dueDate)}
      </span>
    );
  }
  if (bill.status === "today") {
    return (
      <span className={cls}>
        <Clock className="h-3.5 w-3.5" aria-hidden /> Vence hoje
      </span>
    );
  }
  return (
    <span className={cls}>
      <CalendarClock className="h-3.5 w-3.5" aria-hidden /> Vence {dueText(bill)}
    </span>
  );
}

export function FixedClient({
  month,
  today,
  bills,
  overdueBefore,
  summary,
  incomes,
  yearly,
  currency,
  canManage,
  canPay,
}: {
  month: string;
  today: string;
  bills: Bill[];
  overdueBefore: Bill[];
  summary: BillSummary;
  incomes: FixedItem[];
  yearly: FixedItem[];
  currency: string;
  canManage: boolean;
  canPay: boolean;
}) {
  const [editing, setEditing] = useState<Editing>(null);
  const [paying, setPaying] = useState<Bill | null>(null);

  const total = summary.paidTotal + summary.pendingTotal;
  const pct = total > 0 ? Math.round((summary.paidTotal / total) * 100) : 0;
  const count = summary.paidCount + summary.pendingCount;

  return (
    <div className="space-y-6">
      {/* Resumo do mês */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Já pago</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {formatCurrency(summary.paidTotal, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Falta pagar
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {formatCurrency(summary.pendingTotal, currency)}
            </p>
          </div>
        </div>
        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Contas pagas no mês"
        >
          <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {count === 0
            ? "Nenhuma conta neste mês."
            : `${summary.paidCount} de ${count} contas pagas` +
              (summary.overdueCount > 0
                ? ` · ${summary.overdueCount} em atraso`
                : summary.pendingCount === 0
                  ? " · tudo em dia!"
                  : "")}
        </p>
      </section>

      {/* Atrasadas do mês anterior */}
      {overdueBefore.length > 0 && (
        <section className="rounded-xl border border-red-200 bg-red-50/60">
          <header className="flex items-center gap-2 border-b border-red-100 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-[#d03b3b]" aria-hidden />
            <h2 className="text-sm font-semibold text-slate-900">
              Sem pagar do mês passado
            </h2>
          </header>
          <BillList
            bills={overdueBefore}
            currency={currency}
            canManage={canManage}
            canPay={canPay}
            onEdit={(item) => setEditing({ item, type: item.type })}
            onPay={setPaying}
          />
        </section>
      )}

      {/* Despesas do mês */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#eb6834]" />
          <h2 className="text-sm font-semibold text-slate-900">Contas de {formatMonth(month)}</h2>
        </header>
        {bills.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Nenhuma conta neste mês. Ex: aluguel, condomínio, internet, escola, IPVA.
          </p>
        ) : (
          <BillList
            bills={bills}
            currency={currency}
            canManage={canManage}
            canPay={canPay}
            onEdit={(item) => setEditing({ item, type: item.type })}
            onPay={setPaying}
          />
        )}
        {canManage && (
          <div className="border-t border-slate-100 p-3">
            <AddButton onClick={() => setEditing({ item: null, type: "expense" })}>
              Adicionar conta (despesa fixa)
            </AddButton>
          </div>
        )}
      </section>

      {/* Receitas fixas */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2a78d6]" />
          <h2 className="text-sm font-semibold text-slate-900">Receitas fixas</h2>
        </header>
        {incomes.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Nada neste mês. Ex: salário, aluguel recebido, pensão.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {incomes.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => setEditing({ item, type: "income" })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left enabled:hover:bg-slate-50"
                >
                  <DayChip day={item.dayOfMonth} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                    {item.description}
                    {item.frequency === "yearly" && (
                      <span className="ml-2 text-xs font-normal text-slate-500">anual</span>
                    )}
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
            <AddButton onClick={() => setEditing({ item: null, type: "income" })}>
              Adicionar receita fixa
            </AddButton>
          </div>
        )}
      </section>

      {/* Contas anuais */}
      {yearly.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white">
          <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <CalendarClock className="h-4 w-4 text-slate-500" aria-hidden />
            <h2 className="text-sm font-semibold text-slate-900">Cobradas uma vez por ano</h2>
          </header>
          <ul className="divide-y divide-slate-100">
            {yearly.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => setEditing({ item, type: item.type })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left enabled:hover:bg-slate-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {item.description}
                    </span>
                    <span className="block text-xs text-slate-500">
                      Todo ano, dia {item.dayOfMonth} de{" "}
                      {MONTHS[Number(item.startDate.slice(5, 7)) - 1].toLowerCase()}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="px-1 text-xs text-slate-500">
        Contas mensais aparecem todo mês no dia do vencimento; contas anuais (como IPVA) só no mês
        combinado. Ao mudar um valor, o novo valor vale para este mês em diante. O Painel conta como
        despesa fixa só o que foi marcado como pago.
      </p>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing?.item
            ? "Editar item fixo"
            : editing?.type === "income"
              ? "Nova receita fixa"
              : "Nova conta fixa"
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

      <Modal
        open={paying !== null}
        onClose={() => setPaying(null)}
        title={paying?.status === "paid" ? "Pagamento" : "Marcar como paga"}
      >
        {paying && (
          <PayForm
            key={`${paying.item.id}-${paying.month}`}
            bill={paying}
            today={today}
            currency={currency}
            onDone={() => setPaying(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function DayChip({ day }: { day: number }) {
  return (
    <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-700">
      <span className="text-[9px] uppercase leading-none text-slate-500">dia</span>
      <span className="text-sm font-semibold leading-tight">{day}</span>
    </span>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}

function BillList({
  bills,
  currency,
  canManage,
  canPay,
  onEdit,
  onPay,
}: {
  bills: Bill[];
  currency: string;
  canManage: boolean;
  canPay: boolean;
  onEdit: (item: FixedItem) => void;
  onPay: (bill: Bill) => void;
}) {
  return (
    <ul className="divide-y divide-slate-100">
      {bills.map((bill) => {
        const paid = bill.status === "paid";
        const amount = paid ? (bill.paidAmount ?? bill.item.amount) : bill.item.amount;
        return (
          <li key={`${bill.item.id}-${bill.month}`} className="flex items-center gap-2 pr-3">
            <button
              type="button"
              disabled={!canManage}
              onClick={() => onEdit(bill.item)}
              className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left enabled:hover:bg-slate-50"
            >
              <DayChip day={Number(bill.dueDate.slice(8, 10))} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">
                  {bill.item.description}
                  {bill.item.frequency === "yearly" && (
                    <span className="ml-2 text-xs font-normal text-slate-500">anual</span>
                  )}
                </span>
                <StatusLine bill={bill} />
              </span>
              <span
                className={`shrink-0 text-sm font-semibold tabular-nums ${paid ? "text-slate-500" : "text-slate-900"}`}
              >
                {formatCurrency(amount, currency)}
              </span>
            </button>
            {canPay && (
              <button
                type="button"
                onClick={() => onPay(bill)}
                className={
                  paid
                    ? "shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    : "shrink-0 rounded-lg bg-[#2a78d6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1c5cab]"
                }
              >
                {paid ? "Editar" : "Pagar"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PayForm({
  bill,
  today,
  currency,
  onDone,
}: {
  bill: Bill;
  today: string;
  currency: string;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const paid = bill.status === "paid";
  const amount = paid ? (bill.paidAmount ?? bill.item.amount) : bill.item.amount;

  async function submit(formData: FormData) {
    const result = await markPaidAction(bill.item.id, bill.month, formData);
    if (result.error) setError(result.error);
    else onDone();
  }

  async function undo() {
    if (!confirm("Desfazer o pagamento? A conta volta para \"falta pagar\".")) return;
    const result = await undoPaidAction(bill.item.id, bill.month);
    if (result.error) setError(result.error);
    else onDone();
  }

  return (
    <form action={submit} className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{bill.item.description}</p>
        <p className="text-xs text-slate-500">
          Vencimento: {formatDayMonth(bill.dueDate)} · cadastrada por{" "}
          {formatCurrency(bill.item.amount, currency)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="paid_date">Pago em</Label>
          <Input
            id="paid_date"
            name="paid_date"
            type="date"
            required
            defaultValue={bill.paidDate ?? today}
          />
        </div>
        <div>
          <Label htmlFor="pay_amount">Valor pago</Label>
          <MoneyInput
            id="pay_amount"
            name="amount"
            required
            defaultValue={amount.toFixed(2).replace(".", ",")}
          />
        </div>
      </div>
      <FieldError>{error}</FieldError>
      <SubmitButton size="lg" className="w-full">
        {paid ? "Salvar alterações" : "Marcar como paga"}
      </SubmitButton>
      {paid && (
        <button
          type="button"
          onClick={undo}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" /> Desfazer pagamento
        </button>
      )}
    </form>
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
  const [frequency, setFrequency] = useState<FixedFrequency>(item?.frequency ?? "monthly");
  const yearly = frequency === "yearly";
  const currentMonth = new Date().getMonth() + 1;

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
      <input type="hidden" name="frequency" value={frequency} />
      <div>
        <Label htmlFor="description">Nome</Label>
        <Input
          id="description"
          name="description"
          required
          maxLength={60}
          defaultValue={item?.description}
          placeholder={type === "income" ? "Ex: Salário" : "Ex: Aluguel, IPVA"}
        />
      </div>

      {!item && (
        <div>
          <Label htmlFor="frequency_select">Quando cobra</Label>
          <Select
            id="frequency_select"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as FixedFrequency)}
          >
            <option value="monthly">Todo mês</option>
            <option value="yearly">Uma vez por ano (ex: IPVA)</option>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="amount">{yearly ? "Valor da cobrança" : "Valor por mês"}</Label>
          <MoneyInput
            id="amount"
            name="amount"
            required
            defaultValue={item ? item.amount.toFixed(2).replace(".", ",") : ""}
          />
        </div>
        {yearly && (
          <div>
            <Label htmlFor="month_of_year">Mês</Label>
            <Select
              id="month_of_year"
              name="month_of_year"
              defaultValue={item ? Number(item.startDate.slice(5, 7)) : currentMonth}
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="day_of_month">Dia do vencimento</Label>
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
      {yearly && !item && (
        <p className="text-xs text-slate-500">
          Se o mês escolhido já passou este ano, a primeira cobrança aparece no ano que vem.
        </p>
      )}
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
