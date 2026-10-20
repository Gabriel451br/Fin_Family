import { sql } from "@/lib/db/client";
import type { Goal, GoalKind } from "@/lib/types";
import { getTotalsByKindSince } from "@/lib/data/transactions";

export interface GoalWithCategory extends Goal {
  category_name: string | null;
  category_color: string | null;
}

export async function listGoals(
  familyId: string,
  { includeInactive = false }: { includeInactive?: boolean } = {},
): Promise<GoalWithCategory[]> {
  if (includeInactive) {
    return sql<GoalWithCategory[]>`
      select g.*, c.name as category_name, c.color as category_color
      from fin_family.goals g
      left join fin_family.categories c on c.id = g.category_id
      where g.family_id = ${familyId}
      order by g.is_active desc, g.created_at desc
    `;
  }
  return sql<GoalWithCategory[]>`
    select g.*, c.name as category_name, c.color as category_color
    from fin_family.goals g
    left join fin_family.categories c on c.id = g.category_id
    where g.family_id = ${familyId} and g.is_active = true
    order by g.created_at desc
  `;
}

export async function createGoal(data: {
  familyId: string;
  name: string;
  kind: GoalKind;
  targetAmount: number;
  targetDate?: string | null;
  categoryId?: string | null;
  notes?: string | null;
  createdBy: string;
}) {
  const [goal] = await sql<Goal[]>`
    insert into fin_family.goals
      (family_id, name, kind, target_amount, target_date, category_id, notes, created_by)
    values (
      ${data.familyId}, ${data.name}, ${data.kind}, ${data.targetAmount},
      ${data.targetDate ?? null}, ${data.categoryId ?? null}, ${data.notes ?? null}, ${data.createdBy}
    )
    returning *
  `;
  return goal;
}

export async function setGoalActive(familyId: string, id: string, active: boolean) {
  await sql`
    update fin_family.goals set is_active = ${active}
    where family_id = ${familyId} and id = ${id}
  `;
}

export async function deleteGoal(familyId: string, id: string) {
  await sql`
    delete from fin_family.goals
    where family_id = ${familyId} and id = ${id}
  `;
}

/** Progresso calculado a partir das transações desde a criação da meta. */
export async function computeGoalProgress(
  familyId: string,
  goal: Pick<Goal, "kind" | "category_id" | "created_at">,
): Promise<number> {
  const since = goal.created_at.slice(0, 10);

  if (goal.kind === "income_target") {
    return getTotalsByKindSince(familyId, "income", since, goal.category_id);
  }
  if (goal.kind === "investment_target") {
    return getTotalsByKindSince(familyId, "investment", since, goal.category_id);
  }
  if (goal.kind === "expense_limit") {
    return getTotalsByKindSince(familyId, "expense", since, goal.category_id);
  }
  if (goal.kind === "savings_target") {
    const [income, expense] = await Promise.all([
      getTotalsByKindSince(familyId, "income", since),
      getTotalsByKindSince(familyId, "expense", since),
    ]);
    return income - expense;
  }
  return 0;
}
