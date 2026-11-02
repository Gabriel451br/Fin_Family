"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { actionError, type ActionResult } from "@/lib/action-result";
import { parseMoney } from "@/lib/format";
import {
  createFixedItem,
  removeFixedItem,
  updateFixedItem,
} from "@/lib/data/fixed";
import type { FlowType } from "@/lib/finance";

function refresh() {
  revalidatePath("/fixed");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
}

export async function saveFixedAction(
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_budgets_goals");

    const type = String(formData.get("type")) as FlowType;
    if (type !== "income" && type !== "expense") throw new Error("Tipo inválido.");

    const description = String(formData.get("description") ?? "").trim();
    if (!description) throw new Error("Informe o nome.");

    const amount = parseMoney(String(formData.get("amount") ?? ""));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Informe um valor maior que zero.");

    const dayOfMonth = Number(formData.get("day_of_month"));
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      throw new Error("O dia deve ser entre 1 e 31.");
    }

    if (id) {
      await updateFixedItem(member.family_id, id, { description, amount, dayOfMonth });
    } else {
      await createFixedItem({
        familyId: member.family_id,
        description,
        amount,
        type,
        dayOfMonth,
        createdBy: user.id,
      });
    }
  } catch (err) {
    return actionError(err);
  }
  refresh();
  return { ok: true };
}

export async function removeFixedAction(id: string): Promise<ActionResult> {
  const { member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_budgets_goals");
    await removeFixedItem(member.family_id, id);
  } catch (err) {
    return actionError(err);
  }
  refresh();
  return { ok: true };
}
