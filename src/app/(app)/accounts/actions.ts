"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import {
  createAccount,
  updateAccount,
  setAccountArchived,
} from "@/lib/data/accounts";
import type { AccountType } from "@/lib/types";

export interface AccountFormState {
  error?: string;
}

function parseAccountForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "checking") as AccountType;
  const institution = String(formData.get("institution") ?? "").trim();
  const initialBalance = Number(
    String(formData.get("initial_balance") ?? "0").replace(",", "."),
  );
  const color = String(formData.get("color") ?? "#2563eb");

  if (!name) throw new Error("Informe o nome da conta.");
  if (Number.isNaN(initialBalance)) throw new Error("Saldo inicial inválido.");

  return { name, type, institution: institution || null, initialBalance, color };
}

export async function createAccountAction(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_accounts");
    const data = parseAccountForm(formData);
    await createAccount({
      familyId: member.family_id,
      ...data,
      icon: "wallet",
      createdBy: user.id,
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath("/accounts");
  return {};
}

export async function updateAccountAction(
  accountId: string,
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const { member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_accounts");
    const data = parseAccountForm(formData);
    await updateAccount(member.family_id, accountId, { ...data, icon: "wallet" });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath("/accounts");
  return {};
}

export async function toggleAccountArchivedAction(
  accountId: string,
  archived: boolean,
) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_accounts");
  await setAccountArchived(member.family_id, accountId, archived);
  revalidatePath("/accounts");
}

function errorMessage(err: unknown) {
  if (err instanceof PermissionError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erro inesperado.";
}
