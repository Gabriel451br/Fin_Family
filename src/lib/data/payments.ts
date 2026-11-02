import { sql } from "@/lib/db/client";
import type { FixedPayment } from "@/lib/finance";

interface PaymentRow {
  rule_id: string;
  period_month: string;
  paid_date: string;
  amount: string;
}

/** Pagamentos de contas fixas entre dois meses (inclusive). */
export async function listPayments(
  familyId: string,
  fromMonth: string,
  toMonth: string,
): Promise<FixedPayment[]> {
  const rows = await sql<PaymentRow[]>`
    select rule_id, period_month, paid_date, amount
    from fin_family.fixed_payments
    where family_id = ${familyId}
      and period_month >= ${fromMonth} and period_month <= ${toMonth}
  `;
  return rows.map((r) => ({
    ruleId: r.rule_id,
    month: r.period_month,
    paidDate: r.paid_date,
    amount: Number(r.amount),
  }));
}

/** Marca a conta como paga naquele mês (ou corrige data/valor se já estava paga). */
export async function markPaid(data: {
  familyId: string;
  ruleId: string;
  month: string;
  paidDate: string;
  amount: number;
  paidBy: string;
}) {
  // só aceita despesas fixas da própria família
  const [rule] = await sql<{ id: string }[]>`
    select id from fin_family.recurring_rules
    where id = ${data.ruleId} and family_id = ${data.familyId} and type = 'expense'
  `;
  if (!rule) throw new Error("Conta não encontrada.");

  await sql`
    insert into fin_family.fixed_payments
      (family_id, rule_id, period_month, paid_date, amount, paid_by)
    values (
      ${data.familyId}, ${data.ruleId}, ${data.month}, ${data.paidDate},
      ${data.amount}, ${data.paidBy}
    )
    on conflict (rule_id, period_month)
    do update set paid_date = excluded.paid_date, amount = excluded.amount,
                  paid_by = excluded.paid_by
  `;
}

export async function undoPaid(familyId: string, ruleId: string, month: string) {
  await sql`
    delete from fin_family.fixed_payments
    where family_id = ${familyId} and rule_id = ${ruleId} and period_month = ${month}
  `;
}
