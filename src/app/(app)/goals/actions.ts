"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { createGoal, setGoalActive, deleteGoal } from "@/lib/data/goals";
import type { GoalKind } from "@/lib/types";

export interface GoalFormState {
  error?: string;
}

export async function createGoalAction(
  _prevState: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_budgets_goals");
    const name = String(formData.get("name") ?? "").trim();
    const kind = String(formData.get("kind") ?? "savings_target") as GoalKind;
    const targetAmount = Number(String(formData.get("target_amount") ?? "0").replace(",", "."));
    const targetDate = String(formData.get("target_date") ?? "") || null;
    const categoryId = String(formData.get("category_id") ?? "") || null;
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!name) throw new Error("Informe o nome da meta.");
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) throw new Error("Valor inválido.");

    await createGoal({
      familyId: member.family_id,
      name,
      kind,
      targetAmount,
      targetDate,
      categoryId,
      notes,
      createdBy: user.id,
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath("/goals");
  return {};
}

export async function setGoalActiveAction(id: string, active: boolean) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_budgets_goals");
  await setGoalActive(member.family_id, id, active);
  revalidatePath("/goals");
}

export async function deleteGoalAction(id: string) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_budgets_goals");
  await deleteGoal(member.family_id, id);
  revalidatePath("/goals");
}

function errorMessage(err: unknown) {
  if (err instanceof PermissionError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erro inesperado.";
}
