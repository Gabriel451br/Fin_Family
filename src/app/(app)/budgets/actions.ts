"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { actionError, type ActionResult } from "@/lib/action-result";
import { currentMonthStartISO, parseMoney } from "@/lib/format";
import { listCategories } from "@/lib/data/categories";
import { saveBudgetLimits } from "@/lib/data/budgets";

export async function saveBudgetAction(formData: FormData): Promise<ActionResult> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_budgets_goals");

    const categories = (await listCategories(member.family_id)).filter(
      (c) => c.kind === "expense",
    );
    const limits = categories.map((category) => {
      const raw = String(formData.get(`limit_${category.id}`) ?? "").trim();
      const limit = raw === "" ? 0 : parseMoney(raw);
      if (!Number.isFinite(limit) || limit < 0) {
        throw new Error(`Valor inválido em "${category.name}".`);
      }
      return { categoryId: category.id, limit };
    });

    await saveBudgetLimits(member.family_id, user.id, currentMonthStartISO(), limits);
  } catch (err) {
    return actionError(err);
  }
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { ok: true };
}
