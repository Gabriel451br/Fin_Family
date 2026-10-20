import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listTransactions } from "@/lib/data/transactions";
import { listAccounts } from "@/lib/data/accounts";
import { listCategories } from "@/lib/data/categories";
import { listMembers } from "@/lib/data/members";
import { PageHeader } from "@/components/page-header";
import TransactionsClient from "./transactions-client";
import type { TransactionType } from "@/lib/types";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { member } = await requireCurrentMember();
  const sp = await searchParams;

  const filters = {
    from: sp.from || undefined,
    to: sp.to || undefined,
    accountId: sp.account || undefined,
    categoryId: sp.category || undefined,
    memberId: sp.member || undefined,
    type: (sp.type as TransactionType) || undefined,
    search: sp.q || undefined,
  };

  const [transactions, accounts, categories, members] = await Promise.all([
    listTransactions(member.family_id, filters),
    listAccounts(member.family_id),
    listCategories(member.family_id),
    listMembers(member.family_id),
  ]);

  return (
    <div>
      <PageHeader
        title="Transações"
        description="Receitas, despesas, investimentos e transferências da família."
      />
      <TransactionsClient
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        members={members}
        currency={member.family.currency}
        currentMemberId={member.id}
        canAdd={hasPermission(member, "add_transactions")}
        canEditAll={hasPermission(member, "edit_all_transactions")}
        canEditOwn={hasPermission(member, "edit_own_transactions")}
        filters={filters}
      />
    </div>
  );
}
