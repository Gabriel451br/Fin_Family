import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listFixedItems } from "@/lib/data/fixed";
import { listPayments } from "@/lib/data/payments";
import { buildBills, fixedActiveInMonth, summarizeBills } from "@/lib/finance";
import {
  addMonthsISO,
  currentMonthStartISO,
  parseMonthParam,
  todayISO,
} from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { MonthNav } from "@/components/month-nav";
import { FixedClient } from "./fixed-client";

export default async function FixedPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { member } = await requireCurrentMember();
  const { m } = await searchParams;
  const month = parseMonthParam(m);
  const prevMonth = addMonthsISO(month, -1);
  const today = todayISO();

  const [items, payments] = await Promise.all([
    listFixedItems(member.family_id),
    listPayments(member.family_id, prevMonth, month),
  ]);

  const bills = buildBills(items, payments, month, today);
  // contas do mês passado que ficaram sem pagar (só faz sentido olhando o mês atual)
  const overdueBefore =
    month === currentMonthStartISO()
      ? buildBills(items, payments, prevMonth, today).filter((b) => b.status === "overdue")
      : [];
  const incomes = items.filter(
    (i) => i.type === "income" && fixedActiveInMonth(i, month),
  );
  const yearly = items.filter((i) => i.frequency === "yearly" && !i.endDate);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Contas"
        description="Marque o que já foi pago e veja o que falta pagar no mês."
      />
      <MonthNav month={month} basePath="/fixed" />
      <FixedClient
        month={month}
        today={today}
        bills={bills}
        overdueBefore={overdueBefore}
        summary={summarizeBills(bills)}
        incomes={incomes}
        yearly={yearly}
        currency={member.family.currency}
        canManage={hasPermission(member, "manage_budgets_goals")}
        canPay={hasPermission(member, "add_transactions")}
      />
    </div>
  );
}
