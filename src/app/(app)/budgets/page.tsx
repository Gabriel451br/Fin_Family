import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listCategories } from "@/lib/data/categories";
import { getBudgetLimits } from "@/lib/data/budgets";
import { getDashboardData } from "@/lib/data/dashboard";
import { currentMonthStartISO } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { BudgetProjection } from "@/components/dashboard/budget-projection";
import { BudgetForm } from "./budget-form";

export default async function BudgetsPage() {
  const { member } = await requireCurrentMember();
  const month = currentMonthStartISO();
  const canEdit = hasPermission(member, "manage_budgets_goals");

  const [data, categories, limits] = await Promise.all([
    getDashboardData(member.family_id, month),
    listCategories(member.family_id),
    getBudgetLimits(member.family_id, month),
  ]);

  const limitBy = new Map(limits.map((l) => [l.categoryId, l.limit]));
  const rows = categories
    .filter((c) => c.kind === "expense")
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      limit: limitBy.get(c.id) ?? 0,
    }));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Orçamento"
        description="Quanto você quer gastar no máximo por mês em cada categoria."
      />
      <BudgetProjection data={data} currency={member.family.currency} canEdit={false} />
      <BudgetForm rows={rows} canEdit={canEdit} />
    </div>
  );
}
