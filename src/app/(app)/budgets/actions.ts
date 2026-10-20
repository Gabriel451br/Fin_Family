"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { upsertBudget, deleteBudget, copyBudgetsFromPreviousMonth } from "@/lib/data/budgets";
import { sql } from "@/lib/db/client";
import type { CategoryKind } from "@/lib/types";

export interface BudgetFormState {
  error?: string;
}

export async function upsertBudgetAction(
  periodMonth: string,
  _prevState: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_budgets_goals");
    const categoryId = String(formData.get("category_id") ?? "");
    const amountLimit = Number(String(formData.get("amount_limit") ?? "0").replace(",", "."));
    if (!categoryId) throw new Error("Selecione uma categoria.");
    if (!Number.isFinite(amountLimit) || amountLimit <= 0) throw new Error("Valor inválido.");

    const [category] = await sql<{ kind: CategoryKind }[]>`
      select kind from fin_family.categories where id = ${categoryId} and family_id = ${member.family_id}
    `;
    if (!category) throw new Error("Categoria não encontrada.");

    await upsertBudget({
      familyId: member.family_id,
      categoryId,
      kind: category.kind,
      amountLimit,
      periodMonth,
      createdBy: user.id,
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath("/budgets");
  return {};
}

export async function deleteBudgetAction(budgetId: string) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_budgets_goals");
  await deleteBudget(member.family_id, budgetId);
  revalidatePath("/budgets");
}

export async function copyFromPreviousMonthAction(fromMonth: string, toMonth: string) {
  const { user, member } = await requireCurrentMember();
  requirePermission(member, "manage_budgets_goals");
  await copyBudgetsFromPreviousMonth(member.family_id, fromMonth, toMonth, user.id);
  revalidatePath("/budgets");
}

function errorMessage(err: unknown) {
  if (err instanceof PermissionError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erro inesperado.";
}
