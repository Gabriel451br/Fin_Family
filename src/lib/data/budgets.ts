import { sql } from "@/lib/db/client";
import type { Budget, CategoryKind } from "@/lib/types";

export interface BudgetWithCategory extends Budget {
  category_name: string;
  category_color: string;
}

export async function listBudgetsForMonth(
  familyId: string,
  monthStart: string,
): Promise<BudgetWithCategory[]> {
  return sql<BudgetWithCategory[]>`
    select b.*, c.name as category_name, c.color as category_color
    from fin_family.budgets b
    join fin_family.categories c on c.id = b.category_id
    where b.family_id = ${familyId} and b.period_month = ${monthStart}::date
    order by c.name asc
  `;
}

export async function upsertBudget(data: {
  familyId: string;
  categoryId: string;
  kind: CategoryKind;
  amountLimit: number;
  periodMonth: string;
  createdBy: string;
}) {
  const [budget] = await sql<Budget[]>`
    insert into fin_family.budgets (family_id, category_id, kind, amount_limit, period_month, created_by)
    values (${data.familyId}, ${data.categoryId}, ${data.kind}, ${data.amountLimit}, ${data.periodMonth}::date, ${data.createdBy})
    on conflict (family_id, category_id, period_month)
    do update set amount_limit = excluded.amount_limit
    returning *
  `;
  return budget;
}

export async function deleteBudget(familyId: string, budgetId: string) {
  await sql`
    delete from fin_family.budgets
    where family_id = ${familyId} and id = ${budgetId}
  `;
}

export async function copyBudgetsFromPreviousMonth(
  familyId: string,
  fromMonth: string,
  toMonth: string,
  createdBy: string,
) {
  await sql`
    insert into fin_family.budgets (family_id, category_id, kind, amount_limit, period_month, created_by)
    select family_id, category_id, kind, amount_limit, ${toMonth}::date, ${createdBy}
    from fin_family.budgets
    where family_id = ${familyId} and period_month = ${fromMonth}::date
    on conflict (family_id, category_id, period_month) do nothing
  `;
}
