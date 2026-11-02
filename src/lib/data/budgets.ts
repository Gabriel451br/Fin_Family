import { sql } from "@/lib/db/client";
import type { BudgetLimit } from "@/lib/finance";

/**
 * Orçamento vigente em um mês: para cada categoria de despesa vale o último
 * limite definido até aquele mês (limite 0 = sem orçamento).
 */
export async function getBudgetLimits(
  familyId: string,
  monthStart: string,
): Promise<BudgetLimit[]> {
  const rows = await sql<
    { category_id: string; name: string; amount_limit: number }[]
  >`
    select distinct on (b.category_id)
      b.category_id, c.name, b.amount_limit::float8 as amount_limit
    from fin_family.budgets b
    join fin_family.categories c on c.id = b.category_id
    where b.family_id = ${familyId}
      and b.period_month <= ${monthStart}::date
      and c.kind = 'expense'
      and c.is_archived = false
    order by b.category_id, b.period_month desc
  `;
  return rows
    .map((r) => ({
      categoryId: r.category_id,
      name: r.name,
      limit: Number(r.amount_limit),
    }))
    .filter((r) => r.limit > 0);
}

/** Salva os limites a partir do mês informado (vale até ser alterado de novo). */
export async function saveBudgetLimits(
  familyId: string,
  createdBy: string,
  monthStart: string,
  limits: Array<{ categoryId: string; limit: number }>,
) {
  await sql.begin(async (tx) => {
    for (const { categoryId, limit } of limits) {
      await tx`
        insert into fin_family.budgets
          (family_id, category_id, kind, amount_limit, period_month, created_by)
        values (${familyId}, ${categoryId}, 'expense', ${limit}, ${monthStart}::date, ${createdBy})
        on conflict (family_id, category_id, period_month)
        do update set amount_limit = excluded.amount_limit
      `;
    }
  });
}
