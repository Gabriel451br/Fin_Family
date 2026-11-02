"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import {
  canEditTransaction,
  PermissionError,
  requirePermission,
} from "@/lib/permissions";
import { actionError, type ActionResult } from "@/lib/action-result";
import { parseMoney } from "@/lib/format";
import { listCategories } from "@/lib/data/categories";
import { getMemberById } from "@/lib/data/members";
import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  updateTransaction,
  type TransactionInput,
} from "@/lib/data/transactions";
import type { FlowType } from "@/lib/finance";

function refresh() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
}

export async function saveTransactionAction(
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, member } = await requireCurrentMember();
  try {
    const type = String(formData.get("type")) as FlowType;
    if (type !== "income" && type !== "expense") throw new Error("Tipo inválido.");

    const amount = parseMoney(String(formData.get("amount") ?? ""));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Informe um valor maior que zero.");

    const date = String(formData.get("date") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Informe a data.");

    const categoryId = String(formData.get("category_id") ?? "") || null;
    let categoryName: string | null = null;
    if (categoryId) {
      const categories = await listCategories(member.family_id);
      const category = categories.find((c) => c.id === categoryId && c.kind === type);
      if (!category) throw new Error("Categoria inválida.");
      categoryName = category.name;
    }

    let memberId = member.id;
    const requestedMember = String(formData.get("member_id") ?? "");
    if (requestedMember && requestedMember !== member.id) {
      const other = await getMemberById(member.family_id, requestedMember);
      if (!other) throw new Error("Membro inválido.");
      memberId = other.id;
    }

    const input: TransactionInput = {
      type,
      amount,
      date,
      categoryId,
      memberId,
      description:
        String(formData.get("description") ?? "").trim() ||
        categoryName ||
        (type === "income" ? "Receita" : "Despesa"),
    };

    if (id) {
      const existing = await getTransactionById(member.family_id, id);
      if (!existing) throw new Error("Lançamento não encontrado.");
      if (!canEditTransaction(member, existing.member_id)) throw new PermissionError();
      await updateTransaction(member.family_id, id, input);
    } else {
      requirePermission(member, "add_transactions");
      await createTransaction(member.family_id, user.id, input);
    }
  } catch (err) {
    return actionError(err);
  }
  refresh();
  return { ok: true };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const { member } = await requireCurrentMember();
  try {
    const existing = await getTransactionById(member.family_id, id);
    if (!existing) return { ok: true };
    if (!canEditTransaction(member, existing.member_id)) throw new PermissionError();
    await deleteTransaction(member.family_id, id);
  } catch (err) {
    return actionError(err);
  }
  refresh();
  return { ok: true };
}
