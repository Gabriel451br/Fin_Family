import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listMonthTransactions } from "@/lib/data/transactions";
import { listCategories } from "@/lib/data/categories";
import { listMembers } from "@/lib/data/members";
import { parseMonthParam, formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { MonthNav } from "@/components/month-nav";
import { Card } from "@/components/ui/card";
import { EntryForm } from "./entry-form";
import { TransactionList } from "./transaction-list";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { member } = await requireCurrentMember();
  const { m } = await searchParams;
  const month = parseMonthParam(m);

  const [transactions, allCategories, members] = await Promise.all([
    listMonthTransactions(member.family_id, month),
    listCategories(member.family_id),
    listMembers(member.family_id),
  ]);

  const categories = allCategories
    .filter((c) => c.kind === "expense" || c.kind === "income")
    .map((c) => ({ id: c.id, name: c.name, color: c.color, kind: c.kind }));
  const memberOptions = members
    .filter((x) => x.status === "active")
    .map((x) => ({ id: x.id, display_name: x.display_name }));
  const canAdd = hasPermission(member, "add_transactions");
  const canManageCategories = hasPermission(member, "manage_categories");

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Lançar"
        description="Receitas e despesas do dia a dia (as contas fixas ficam em “Contas”)."
      />

      {canAdd ? (
        <Card>
          <EntryForm
            categories={categories}
            members={memberOptions}
            currentMemberId={member.id}
            canManageCategories={canManageCategories}
          />
        </Card>
      ) : (
        <Card className="text-sm text-slate-500">
          Seu acesso é só de visualização — você não pode fazer lançamentos.
        </Card>
      )}

      <div className="space-y-3">
        <MonthNav month={month} basePath="/transactions" />
        <p className="text-center text-xs text-slate-500">
          Variáveis do mês: receitas{" "}
          <span className="font-medium text-slate-700">
            {formatCurrency(income, member.family.currency)}
          </span>{" "}
          · despesas{" "}
          <span className="font-medium text-slate-700">
            {formatCurrency(expense, member.family.currency)}
          </span>
        </p>
        <TransactionList
          transactions={transactions.map((t) => ({
            id: t.id,
            type: t.type as "income" | "expense",
            amount: t.amount,
            date: t.date,
            description: t.description,
            category_id: t.category_id,
            member_id: t.member_id,
            category_name: t.category_name,
            category_color: t.category_color,
            member_name: t.member_name,
          }))}
          categories={categories}
          members={memberOptions}
          currency={member.family.currency}
          currentMemberId={member.id}
          canEditAll={hasPermission(member, "edit_all_transactions")}
          canEditOwn={hasPermission(member, "edit_own_transactions")}
          canManageCategories={canManageCategories}
        />
      </div>
    </div>
  );
}
