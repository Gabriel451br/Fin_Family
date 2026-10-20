import { sql } from "@/lib/db/client";
import type { Transaction, TransactionType } from "@/lib/types";
import { randomUUID } from "crypto";

export interface TransactionWithDetails extends Transaction {
  category_name: string | null;
  category_color: string | null;
  account_name: string | null;
  member_name: string | null;
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  memberId?: string;
  type?: TransactionType;
  search?: string;
  limit?: number;
}

export async function listTransactions(
  familyId: string,
  filters: TransactionFilters = {},
): Promise<TransactionWithDetails[]> {
  const { from, to, accountId, categoryId, memberId, type, search, limit = 500 } =
    filters;

  return sql<TransactionWithDetails[]>`
    select
      t.*,
      c.name as category_name,
      c.color as category_color,
      a.name as account_name,
      fm.display_name as member_name
    from fin_family.transactions t
    left join fin_family.categories c on c.id = t.category_id
    left join fin_family.accounts a on a.id = t.account_id
    left join fin_family.family_members fm on fm.id = t.member_id
    where t.family_id = ${familyId}
      and (${from ?? null}::date is null or t.date >= ${from ?? null})
      and (${to ?? null}::date is null or t.date <= ${to ?? null})
      and (${accountId ?? null}::uuid is null or t.account_id = ${accountId ?? null})
      and (${categoryId ?? null}::uuid is null or t.category_id = ${categoryId ?? null})
      and (${memberId ?? null}::uuid is null or t.member_id = ${memberId ?? null})
      and (${type ?? null}::fin_family.transaction_type is null or t.type = ${type ?? null})
      and (${search ?? null}::text is null or t.description ilike ${search ? `%${search}%` : null})
    order by t.date desc, t.created_at desc
    limit ${limit}
  `;
}

export async function getTransactionById(
  familyId: string,
  id: string,
): Promise<Transaction | null> {
  const rows = await sql<Transaction[]>`
    select * from fin_family.transactions
    where family_id = ${familyId} and id = ${id}
  `;
  return rows[0] ?? null;
}

export interface CreateTransactionInput {
  familyId: string;
  accountId: string | null;
  categoryId: string | null;
  memberId: string | null;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  notes?: string | null;
  createdBy: string;
  installments?: number;
}

export async function createTransaction(input: CreateTransactionInput) {
  const installments = Math.max(1, Math.floor(input.installments ?? 1));

  if (installments <= 1) {
    const [tx] = await sql<Transaction[]>`
      insert into fin_family.transactions
        (family_id, account_id, category_id, member_id, type, description, amount, date, notes, created_by)
      values (
        ${input.familyId}, ${input.accountId}, ${input.categoryId}, ${input.memberId},
        ${input.type}, ${input.description}, ${input.amount}, ${input.date}, ${input.notes ?? null},
        ${input.createdBy}
      )
      returning *
    `;
    return [tx];
  }

  const groupId = randomUUID();
  const perInstallment = Math.round((input.amount / installments) * 100) / 100;
  const remainder =
    Math.round((input.amount - perInstallment * installments) * 100) / 100;

  const baseDate = new Date(`${input.date}T00:00:00`);
  const rows: Transaction[] = [];

  await sql.begin(async (tx) => {
    for (let i = 0; i < installments; i++) {
      const occurrenceDate = new Date(baseDate);
      occurrenceDate.setMonth(occurrenceDate.getMonth() + i);
      const amount =
        i === installments - 1 ? perInstallment + remainder : perInstallment;

      const [row] = await tx<Transaction[]>`
        insert into fin_family.transactions
          (family_id, account_id, category_id, member_id, type, description, amount, date,
           notes, created_by, installment_group_id, installment_number, installment_total)
        values (
          ${input.familyId}, ${input.accountId}, ${input.categoryId}, ${input.memberId},
          ${input.type}, ${input.description}, ${amount},
          ${occurrenceDate.toISOString().slice(0, 10)}, ${input.notes ?? null},
          ${input.createdBy}, ${groupId}, ${i + 1}, ${installments}
        )
        returning *
      `;
      rows.push(row);
    }
  });

  return rows;
}

export async function updateTransaction(
  familyId: string,
  id: string,
  data: {
    accountId: string | null;
    categoryId: string | null;
    memberId: string | null;
    type: TransactionType;
    description: string;
    amount: number;
    date: string;
    notes?: string | null;
  },
) {
  await sql`
    update fin_family.transactions
    set account_id = ${data.accountId}, category_id = ${data.categoryId},
        member_id = ${data.memberId}, type = ${data.type}, description = ${data.description},
        amount = ${data.amount}, date = ${data.date}, notes = ${data.notes ?? null},
        updated_at = now()
    where family_id = ${familyId} and id = ${id}
  `;
}

export async function deleteTransaction(familyId: string, id: string) {
  await sql`
    delete from fin_family.transactions
    where family_id = ${familyId} and id = ${id}
  `;
}

export async function deleteInstallmentGroup(familyId: string, groupId: string) {
  await sql`
    delete from fin_family.transactions
    where family_id = ${familyId} and installment_group_id = ${groupId}
  `;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  investment: number;
}

export async function getMonthlySummary(
  familyId: string,
  monthStart: string,
): Promise<MonthlySummary> {
  const rows = await sql<{ type: TransactionType; total: string }[]>`
    select type, sum(amount) as total
    from fin_family.transactions
    where family_id = ${familyId}
      and date >= ${monthStart}::date
      and date < (${monthStart}::date + interval '1 month')
      and status = 'confirmed'
    group by type
  `;
  const summary: MonthlySummary = { income: 0, expense: 0, investment: 0 };
  for (const row of rows) {
    if (row.type === "income") summary.income = Number(row.total);
    if (row.type === "expense") summary.expense = Number(row.total);
    if (row.type === "investment") summary.investment = Number(row.total);
  }
  return summary;
}

export async function getCategorySpendForMonth(
  familyId: string,
  monthStart: string,
): Promise<Record<string, number>> {
  const rows = await sql<{ category_id: string; total: string }[]>`
    select category_id, sum(amount) as total
    from fin_family.transactions
    where family_id = ${familyId}
      and category_id is not null
      and date >= ${monthStart}::date
      and date < (${monthStart}::date + interval '1 month')
      and status = 'confirmed'
    group by category_id
  `;
  return Object.fromEntries(rows.map((r) => [r.category_id, Number(r.total)]));
}

export async function getTotalsByKindSince(
  familyId: string,
  type: TransactionType,
  sinceDate: string,
  categoryId?: string | null,
): Promise<number> {
  const rows = await sql<{ total: string | null }[]>`
    select sum(amount) as total
    from fin_family.transactions
    where family_id = ${familyId}
      and type = ${type}
      and status = 'confirmed'
      and date >= ${sinceDate}::date
      and (${categoryId ?? null}::uuid is null or category_id = ${categoryId ?? null})
  `;
  return Number(rows[0]?.total ?? 0);
}
