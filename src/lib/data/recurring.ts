import { sql } from "@/lib/db/client";
import type { RecurrenceFrequency, RecurringRule, TransactionType } from "@/lib/types";
import { createTransaction } from "@/lib/data/transactions";

export { projectOccurrences } from "@/lib/recurrence";

export interface RecurringRuleWithDetails extends RecurringRule {
  category_name: string | null;
  category_color: string | null;
  account_name: string | null;
}

export async function listRecurringRules(
  familyId: string,
  { includeInactive = false }: { includeInactive?: boolean } = {},
): Promise<RecurringRuleWithDetails[]> {
  if (includeInactive) {
    return sql<RecurringRuleWithDetails[]>`
      select r.*, c.name as category_name, c.color as category_color, a.name as account_name
      from fin_family.recurring_rules r
      left join fin_family.categories c on c.id = r.category_id
      left join fin_family.accounts a on a.id = r.account_id
      where r.family_id = ${familyId}
      order by r.is_active desc, r.description asc
    `;
  }
  return sql<RecurringRuleWithDetails[]>`
    select r.*, c.name as category_name, c.color as category_color, a.name as account_name
    from fin_family.recurring_rules r
    left join fin_family.categories c on c.id = r.category_id
    left join fin_family.accounts a on a.id = r.account_id
    where r.family_id = ${familyId} and r.is_active = true
    order by r.description asc
  `;
}

export async function getRecurringRuleById(
  familyId: string,
  id: string,
): Promise<RecurringRule | null> {
  const rows = await sql<RecurringRule[]>`
    select * from fin_family.recurring_rules
    where family_id = ${familyId} and id = ${id}
  `;
  return rows[0] ?? null;
}

export async function createRecurringRule(data: {
  familyId: string;
  accountId: string | null;
  categoryId: string | null;
  description: string;
  amount: number;
  type: TransactionType;
  frequency: RecurrenceFrequency;
  intervalCount: number;
  dayOfMonth?: number | null;
  startDate: string;
  endDate?: string | null;
  createdBy: string;
}) {
  const [rule] = await sql<RecurringRule[]>`
    insert into fin_family.recurring_rules
      (family_id, account_id, category_id, description, amount, type, frequency,
       interval_count, day_of_month, start_date, end_date, created_by)
    values (
      ${data.familyId}, ${data.accountId}, ${data.categoryId}, ${data.description},
      ${data.amount}, ${data.type}, ${data.frequency}, ${data.intervalCount},
      ${data.dayOfMonth ?? null}, ${data.startDate}, ${data.endDate ?? null}, ${data.createdBy}
    )
    returning *
  `;
  return rule;
}

export async function setRecurringRuleActive(
  familyId: string,
  id: string,
  active: boolean,
) {
  await sql`
    update fin_family.recurring_rules
    set is_active = ${active}
    where family_id = ${familyId} and id = ${id}
  `;
}

export async function deleteRecurringRule(familyId: string, id: string) {
  await sql`
    delete from fin_family.recurring_rules
    where family_id = ${familyId} and id = ${id}
  `;
}

export async function confirmRecurringOccurrence(params: {
  familyId: string;
  rule: RecurringRule;
  memberId: string | null;
  date: string;
  createdBy: string;
}) {
  const [tx] = await createTransaction({
    familyId: params.familyId,
    accountId: params.rule.account_id,
    categoryId: params.rule.category_id,
    memberId: params.memberId,
    type: params.rule.type,
    description: params.rule.description,
    amount: Number(params.rule.amount),
    date: params.date,
    createdBy: params.createdBy,
  });

  await sql`
    update fin_family.transactions
    set source = 'recurring', recurring_rule_id = ${params.rule.id}
    where id = ${tx.id}
  `;

  return tx;
}
