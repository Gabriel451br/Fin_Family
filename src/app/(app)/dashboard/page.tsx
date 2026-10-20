import Link from "next/link";
import { requireCurrentMember } from "@/lib/auth";
import { listAccounts, getAccountBalances } from "@/lib/data/accounts";
import {
  getMonthlySummary,
  getCategorySpendForMonth,
  listTransactions,
} from "@/lib/data/transactions";
import { listBudgetsForMonth } from "@/lib/data/budgets";
import { listGoals, computeGoalProgress } from "@/lib/data/goals";
import { listRecurringRules } from "@/lib/data/recurring";
import { currentMonthStartISO } from "@/lib/format";
import { projectOccurrences } from "@/lib/recurrence";
import { PageHeader } from "@/components/page-header";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const { member } = await requireCurrentMember();
  const monthStart = currentMonthStartISO();

  const [accounts, balances, summary, budgets, spend, goals, rules, recentTx] =
    await Promise.all([
      listAccounts(member.family_id),
      getAccountBalances(member.family_id),
      getMonthlySummary(member.family_id, monthStart),
      listBudgetsForMonth(member.family_id, monthStart),
      getCategorySpendForMonth(member.family_id, monthStart),
      listGoals(member.family_id),
      listRecurringRules(member.family_id),
      listTransactions(member.family_id, { limit: 8 }),
    ]);

  const goalsWithProgress = await Promise.all(
    goals.slice(0, 4).map(async (goal) => ({
      ...goal,
      currentAmount: await computeGoalProgress(member.family_id, goal),
    })),
  );

  const upcoming = rules
    .flatMap((rule) =>
      projectOccurrences(rule, 2).map((date) => ({ rule, date })),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  const netWorth = Object.values(balances).reduce((sum, v) => sum + v, 0);

  return (
    <div>
      <PageHeader
        title={`Olá, ${member.display_name.split(" ")[0]}`}
        description="Visão geral das finanças da família neste mês."
        action={
          <Link
            href="/transactions"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Nova transação
          </Link>
        }
      />
      <DashboardClient
        currency={member.family.currency}
        netWorth={netWorth}
        summary={summary}
        accounts={accounts}
        balances={balances}
        budgets={budgets}
        spend={spend}
        goals={goalsWithProgress}
        upcoming={upcoming}
        recentTx={recentTx}
      />
    </div>
  );
}
