import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listFixedItems } from "@/lib/data/fixed";
import { fixedActiveInMonth } from "@/lib/finance";
import { currentMonthStartISO } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { FixedClient } from "./fixed-client";

export default async function FixedPage() {
  const { member } = await requireCurrentMember();
  const month = currentMonthStartISO();
  const items = (await listFixedItems(member.family_id)).filter((item) =>
    fixedActiveInMonth(item, month) || item.startDate.slice(0, 7) > month.slice(0, 7),
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Fixos"
        description="O que entra e sai todo mês, sempre no mesmo dia. Cadastre uma vez só."
      />
      <FixedClient
        items={items}
        currency={member.family.currency}
        canManage={hasPermission(member, "manage_budgets_goals")}
      />
    </div>
  );
}
