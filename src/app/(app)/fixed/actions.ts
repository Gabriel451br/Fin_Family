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
import { markPaid, undoPaid } from "@/lib/data/payments";
import type { FixedFrequency, FlowType, Wallet } from "@/lib/finance";

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

    // dinheiro/vale só faz sentido para receitas; débito automático só para despesas
    const wallet: Wallet =
      type === "income" && formData.get("wallet") === "benefit" ? "benefit" : "cash";
    const autoDebit = type === "expense" && formData.get("auto_debit") === "on";

    const frequency = String(formData.get("frequency") ?? "monthly") as FixedFrequency;
    if (frequency !== "monthly" && frequency !== "yearly") throw new Error("Frequência inválida.");

    const monthOfYear = Number(formData.get("month_of_year") ?? 1);
    if (frequency === "yearly" && (!Number.isInteger(monthOfYear) || monthOfYear < 1 || monthOfYear > 12)) {
      throw new Error("Escolha o mês do vencimento.");
    }

    const dayOfMonth = Number(formData.get("day_of_month"));
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      throw new Error("O dia deve ser entre 1 e 31.");
    }

    if (id) {
      await updateFixedItem(member.family_id, id, {
        description,
        amount,
        dayOfMonth,
        monthOfYear,
        wallet,
        autoDebit,
      });
    } else {
      await createFixedItem({
        familyId: member.family_id,
        description,
        amount,
        type,
        frequency,
        monthOfYear,
        dayOfMonth,
        wallet,
        autoDebit,
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

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])-01$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Marca a conta do mês como paga (ou corrige a data/valor de um pagamento). */
export async function markPaidAction(
  ruleId: string,
  month: string,
  formData: FormData,
): Promise<ActionResult> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "add_transactions");
    if (!MONTH_RE.test(month)) throw new Error("Mês inválido.");

    const paidDate = String(formData.get("paid_date") ?? "");
    if (!DATE_RE.test(paidDate)) throw new Error("Informe a data do pagamento.");

    const amount = parseMoney(String(formData.get("amount") ?? ""));
    if (!Number.isFinite(amount) || amount < 0) throw new Error("Informe o valor pago.");

    await markPaid({
      familyId: member.family_id,
      ruleId,
      month,
      paidDate,
      amount,
      paidBy: user.id,
    });
  } catch (err) {
    return actionError(err);
  }
  refresh();
  return { ok: true };
}

export async function undoPaidAction(
  ruleId: string,
  month: string,
): Promise<ActionResult> {
  const { member } = await requireCurrentMember();
  try {
    requirePermission(member, "add_transactions");
    if (!MONTH_RE.test(month)) throw new Error("Mês inválido.");
    await undoPaid(member.family_id, ruleId, month);
  } catch (err) {
    return actionError(err);
  }
  refresh();
  return { ok: true };
}
