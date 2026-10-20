import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listRecurringRules } from "@/lib/data/recurring";
import { listAccounts } from "@/lib/data/accounts";
import { listCategories } from "@/lib/data/categories";
import { PageHeader } from "@/components/page-header";
import RecurringClient from "./recurring-client";

export default async function RecurringPage() {
  const { member } = await requireCurrentMember();
  const [rules, accounts, categories] = await Promise.all([
    listRecurringRules(member.family_id, { includeInactive: true }),
    listAccounts(member.family_id),
    listCategories(member.family_id),
  ]);

  return (
    <div>
      <PageHeader
        title="Recorrentes"
        description="Despesas e receitas fixas, assinaturas e lançamentos futuros esperados."
      />
      <RecurringClient
        rules={rules}
        accounts={accounts}
        categories={categories}
        currency={member.family.currency}
        canManage={hasPermission(member, "manage_budgets_goals")}
      />
    </div>
  );
}
