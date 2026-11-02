import { sql } from "@/lib/db/client";
import type { Transaction } from "@/lib/types";
import type { FlowType } from "@/lib/finance";

export interface TransactionWithDetails extends Transaction {
  category_name: string | null;
  category_color: string | null;
  member_name: string | null;
}

/** Lançamentos variáveis (receitas e despesas avulsas) de um mês. */
export async function listMonthTransactions(
  familyId: string,
  monthStart: string,
): Promise<TransactionWithDetails[]> {
  return sql<TransactionWithDetails[]>`
    select
      t.*,
      c.name as category_name,
      c.color as category_color,
      fm.display_name as member_name
    from fin_family.transactions t
    left join fin_family.categories c on c.id = t.category_id
    left join fin_family.family_members fm on fm.id = t.member_id
    where t.family_id = ${familyId}
      and t.type in ('income', 'expense')
      and t.date >= ${monthStart}::date
      and t.date < (${monthStart}::date + interval '1 month')
    order by t.date desc, t.created_at desc
    limit 500
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

export interface TransactionInput {
  type: FlowType;
  categoryId: string | null;
  memberId: string | null;
  description: string;
  amount: number;
  date: string;
}

export async function createTransaction(
  familyId: string,
  createdBy: string,
  input: TransactionInput,
) {
  await sql`
    insert into fin_family.transactions
      (family_id, category_id, member_id, type, description, amount, date, created_by)
    values (
      ${familyId}, ${input.categoryId}, ${input.memberId}, ${input.type},
      ${input.description}, ${input.amount}, ${input.date}, ${createdBy}
    )
  `;
}

export async function updateTransaction(
  familyId: string,
  id: string,
  input: TransactionInput,
) {
  await sql`
    update fin_family.transactions
    set category_id = ${input.categoryId}, member_id = ${input.memberId}, type = ${input.type},
        description = ${input.description}, amount = ${input.amount}, date = ${input.date},
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

/** Soma mensal de receitas e despesas variáveis, de `fromMonth` (inclusive) até `toMonth` (inclusive). */
export async function getMonthlyVariableTotals(
  familyId: string,
  fromMonth: string,
  toMonth: string,
): Promise<Record<string, { income: number; expense: number }>> {
  const rows = await sql<{ ym: string; type: FlowType; total: number }[]>`
    select to_char(date, 'YYYY-MM') as ym, type::text as type, sum(amount)::float8 as total
    from fin_family.transactions
    where family_id = ${familyId}
      and status = 'confirmed'
      and type in ('income', 'expense')
      and date >= ${fromMonth}::date
      and date < (${toMonth}::date + interval '1 month')
    group by 1, 2
  `;
  const result: Record<string, { income: number; expense: number }> = {};
  for (const row of rows) {
    const entry = (result[`${row.ym}-01`] ??= { income: 0, expense: 0 });
    entry[row.type] = Number(row.total);
  }
  return result;
}

/** Despesas variáveis do mês agrupadas por categoria. */
export async function getExpenseByCategory(familyId: string, monthStart: string) {
  const rows = await sql<
    { category_id: string | null; name: string; total: number }[]
  >`
    select t.category_id, coalesce(c.name, 'Sem categoria') as name, sum(t.amount)::float8 as total
    from fin_family.transactions t
    left join fin_family.categories c on c.id = t.category_id
    where t.family_id = ${familyId}
      and t.type = 'expense'
      and t.status = 'confirmed'
      and t.date >= ${monthStart}::date
      and t.date < (${monthStart}::date + interval '1 month')
    group by t.category_id, c.name
    order by total desc
  `;
  return rows.map((r) => ({
    categoryId: r.category_id,
    name: r.name,
    spent: Number(r.total),
  }));
}
