import { sql } from "@/lib/db/client";
import type { Account, AccountType } from "@/lib/types";

export async function listAccounts(
  familyId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<Account[]> {
  if (includeArchived) {
    return sql<Account[]>`
      select * from fin_family.accounts
      where family_id = ${familyId}
      order by is_archived asc, created_at asc
    `;
  }
  return sql<Account[]>`
    select * from fin_family.accounts
    where family_id = ${familyId} and is_archived = false
    order by created_at asc
  `;
}

export async function getAccountBalances(
  familyId: string,
): Promise<Record<string, number>> {
  const rows = await sql<{ account_id: string; balance: string }[]>`
    select
      a.id as account_id,
      a.initial_balance + coalesce(sum(
        case
          when t.type = 'income' then t.amount
          when t.type = 'investment' then -t.amount
          when t.type = 'expense' then -t.amount
          else 0
        end
      ), 0) as balance
    from fin_family.accounts a
    left join fin_family.transactions t
      on t.account_id = a.id and t.status = 'confirmed'
    where a.family_id = ${familyId}
    group by a.id, a.initial_balance
  `;
  return Object.fromEntries(rows.map((r) => [r.account_id, Number(r.balance)]));
}

export async function createAccount(data: {
  familyId: string;
  name: string;
  type: AccountType;
  institution?: string | null;
  initialBalance: number;
  color: string;
  icon: string;
  createdBy: string;
}) {
  const [account] = await sql<Account[]>`
    insert into fin_family.accounts
      (family_id, name, type, institution, initial_balance, color, icon, created_by)
    values (
      ${data.familyId}, ${data.name}, ${data.type}, ${data.institution ?? null},
      ${data.initialBalance}, ${data.color}, ${data.icon}, ${data.createdBy}
    )
    returning *
  `;
  return account;
}

export async function updateAccount(
  familyId: string,
  accountId: string,
  data: {
    name: string;
    type: AccountType;
    institution?: string | null;
    initialBalance: number;
    color: string;
    icon: string;
  },
) {
  await sql`
    update fin_family.accounts
    set name = ${data.name}, type = ${data.type}, institution = ${data.institution ?? null},
        initial_balance = ${data.initialBalance}, color = ${data.color}, icon = ${data.icon},
        updated_at = now()
    where family_id = ${familyId} and id = ${accountId}
  `;
}

export async function setAccountArchived(
  familyId: string,
  accountId: string,
  archived: boolean,
) {
  await sql`
    update fin_family.accounts
    set is_archived = ${archived}, updated_at = now()
    where family_id = ${familyId} and id = ${accountId}
  `;
}
