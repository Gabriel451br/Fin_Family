"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission, canEditTransaction, PermissionError } from "@/lib/permissions";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteInstallmentGroup,
  getTransactionById,
} from "@/lib/data/transactions";
import type { TransactionType } from "@/lib/types";

export interface TransactionFormState {
  error?: string;
}

function parseForm(formData: FormData) {
  const type = String(formData.get("type") ?? "expense") as TransactionType;
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "0").replace(",", "."));
  const date = String(formData.get("date") ?? "");
  const accountId = String(formData.get("account_id") ?? "") || null;
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const memberId = String(formData.get("member_id") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const installments = Number(formData.get("installments") ?? "1") || 1;

  if (!description) throw new Error("Informe uma descrição.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Valor inválido.");
  if (!date) throw new Error("Informe a data.");

  return { type, description, amount, date, accountId, categoryId, memberId, notes, installments };
}

export async function createTransactionAction(
  _prevState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "add_transactions");
    const data = parseForm(formData);
    await createTransaction({
      familyId: member.family_id,
      accountId: data.accountId,
      categoryId: data.categoryId,
      memberId: data.memberId ?? member.id,
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: data.date,
      notes: data.notes,
      createdBy: user.id,
      installments: data.installments,
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return {};
}

export async function updateTransactionAction(
  transactionId: string,
  _prevState: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const { member } = await requireCurrentMember();
  try {
    const existing = await getTransactionById(member.family_id, transactionId);
    if (!existing) throw new Error("Transação não encontrada.");
    if (!canEditTransaction(member, existing.member_id)) throw new PermissionError();

    const data = parseForm(formData);
    await updateTransaction(member.family_id, transactionId, {
      accountId: data.accountId,
      categoryId: data.categoryId,
      memberId: data.memberId ?? member.id,
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: data.date,
      notes: data.notes,
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteTransactionAction(transactionId: string) {
  const { member } = await requireCurrentMember();
  const existing = await getTransactionById(member.family_id, transactionId);
  if (!existing) return;
  if (!canEditTransaction(member, existing.member_id)) throw new PermissionError();
  await deleteTransaction(member.family_id, transactionId);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function deleteInstallmentGroupAction(groupId: string) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "edit_all_transactions");
  await deleteInstallmentGroup(member.family_id, groupId);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

function errorMessage(err: unknown) {
  if (err instanceof PermissionError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erro inesperado.";
}
