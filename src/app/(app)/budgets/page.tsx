import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listBudgetsForMonth } from "@/lib/data/budgets";
import { getCategorySpendForMonth } from "@/lib/data/transactions";
import { listCategories } from "@/lib/data/categories";
import { currentMonthStartISO } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import BudgetsClient from "./budgets-client";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { member } = await requireCurrentMember();
  const { month } = await searchParams;
  const periodMonth = month || currentMonthStartISO();

  const [budgets, spend, categories] = await Promise.all([
    listBudgetsForMonth(member.family_id, periodMonth),
    getCategorySpendForMonth(member.family_id, periodMonth),
    listCategories(member.family_id),
  ]);

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Defina limites mensais por categoria e acompanhe o quanto já foi gasto."
      />
      <BudgetsClient
        periodMonth={periodMonth}
        budgets={budgets}
        spend={spend}
        categories={categories}
        currency={member.family.currency}
        canManage={hasPermission(member, "manage_budgets_goals")}
      />
    </div>
  );
}
