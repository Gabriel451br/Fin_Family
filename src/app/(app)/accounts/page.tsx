import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listAccounts, getAccountBalances } from "@/lib/data/accounts";
import { PageHeader } from "@/components/page-header";
import AccountsClient from "./accounts-client";

export default async function AccountsPage() {
  const { member } = await requireCurrentMember();
  const [accounts, balances] = await Promise.all([
    listAccounts(member.family_id, { includeArchived: true }),
    getAccountBalances(member.family_id),
  ]);

  return (
    <div>
      <PageHeader
        title="Contas"
        description="Contas correntes, poupança, investimentos, cartões e dinheiro da família."
      />
      <AccountsClient
        accounts={accounts}
        balances={balances}
        currency={member.family.currency}
        canManage={hasPermission(member, "manage_accounts")}
      />
    </div>
  );
}
