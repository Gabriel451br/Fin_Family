import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getDashboardData } from "@/lib/data/dashboard";
import { parseMonthParam } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { member } = await requireCurrentMember();
  const { m } = await searchParams;
  const data = await getDashboardData(member.family_id, parseMonthParam(m));

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={`Olá, ${member.display_name.split(" ")[0]}`}
        description={`Painel da família ${member.family.name}`}
      />
      <DashboardView
        data={data}
        currency={member.family.currency}
        canEditBudget={hasPermission(member, "manage_budgets_goals")}
      />
    </div>
  );
}
