import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listGoals, computeGoalProgress } from "@/lib/data/goals";
import { listCategories } from "@/lib/data/categories";
import { PageHeader } from "@/components/page-header";
import GoalsClient from "./goals-client";

export default async function GoalsPage() {
  const { member } = await requireCurrentMember();
  const [goals, categories] = await Promise.all([
    listGoals(member.family_id, { includeInactive: true }),
    listCategories(member.family_id),
  ]);

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => ({
      ...goal,
      currentAmount: await computeGoalProgress(member.family_id, goal),
    })),
  );

  return (
    <div>
      <PageHeader
        title="Metas"
        description="Metas de renda, gasto, investimento e economia da família."
      />
      <GoalsClient
        goals={goalsWithProgress}
        categories={categories}
        currency={member.family.currency}
        canManage={hasPermission(member, "manage_budgets_goals")}
      />
    </div>
  );
}
