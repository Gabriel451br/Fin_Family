"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import {
  createRecurringRule,
  setRecurringRuleActive,
  deleteRecurringRule,
  getRecurringRuleById,
  confirmRecurringOccurrence,
} from "@/lib/data/recurring";
import type { RecurrenceFrequency, TransactionType } from "@/lib/types";

export interface RecurringFormState {
  error?: string;
}

export async function createRecurringRuleAction(
  _prevState: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_budgets_goals");

    const description = String(formData.get("description") ?? "").trim();
    const amount = Number(String(formData.get("amount") ?? "0").replace(",", "."));
    const type = String(formData.get("type") ?? "expense") as TransactionType;
    const frequency = String(formData.get("frequency") ?? "monthly") as RecurrenceFrequency;
    const intervalCount = Number(formData.get("interval_count") ?? "1") || 1;
    const startDate = String(formData.get("start_date") ?? "");
    const endDate = String(formData.get("end_date") ?? "") || null;
    const accountId = String(formData.get("account_id") ?? "") || null;
    const categoryId = String(formData.get("category_id") ?? "") || null;

    if (!description) throw new Error("Informe uma descrição.");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Valor inválido.");
    if (!startDate) throw new Error("Informe a data de início.");

    await createRecurringRule({
      familyId: member.family_id,
      accountId,
      categoryId,
      description,
      amount,
      type,
      frequency,
      intervalCount,
      startDate,
      endDate,
      createdBy: user.id,
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath("/recurring");
  return {};
}

export async function toggleRecurringRuleAction(id: string, active: boolean) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_budgets_goals");
  await setRecurringRuleActive(member.family_id, id, active);
  revalidatePath("/recurring");
}

export async function deleteRecurringRuleAction(id: string) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_budgets_goals");
  await deleteRecurringRule(member.family_id, id);
  revalidatePath("/recurring");
}

export async function confirmOccurrenceAction(ruleId: string, date: string) {
  const { user, member } = await requireCurrentMember();
  requirePermission(member, "add_transactions");
  const rule = await getRecurringRuleById(member.family_id, ruleId);
  if (!rule) throw new Error("Regra não encontrada.");
  await confirmRecurringOccurrence({
    familyId: member.family_id,
    rule,
    memberId: member.id,
    date,
    createdBy: user.id,
  });
  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

function errorMessage(err: unknown) {
  if (err instanceof PermissionError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erro inesperado.";
}
