"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { actionError, type ActionResult } from "@/lib/action-result";
import {
  createCategory,
  listCategories,
  setCategoryArchived,
  updateCategory,
} from "@/lib/data/categories";
import { CATEGORY_COLORS } from "@/lib/constants";
import type { Category } from "@/lib/types";

type Kind = "expense" | "income";

function refresh() {
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function createCategoryAction(
  kind: Kind,
  name: string,
): Promise<ActionResult & { category?: Pick<Category, "id" | "name" | "color" | "kind"> }> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_categories");
    if (kind !== "expense" && kind !== "income") throw new Error("Tipo inválido.");
    const clean = name.trim();
    if (!clean) throw new Error("Informe o nome.");
    if (clean.length > 40) throw new Error("Nome muito longo (máx. 40 letras).");

    const color = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
    const created = await createCategory({
      familyId: member.family_id,
      name: clean,
      kind,
      color,
      icon: "tag",
      createdBy: user.id,
    });
    refresh();
    return {
      ok: true,
      category: { id: created.id, name: created.name, color: created.color, kind: created.kind },
    };
  } catch (err) {
    return actionError(err);
  }
}

export async function renameCategoryAction(
  id: string,
  name: string,
): Promise<ActionResult> {
  const { member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_categories");
    const clean = name.trim();
    if (!clean) throw new Error("Informe o nome.");
    if (clean.length > 40) throw new Error("Nome muito longo (máx. 40 letras).");
    const category = (
      await listCategories(member.family_id, { includeArchived: true })
    ).find((c) => c.id === id);
    if (!category) throw new Error("Categoria não encontrada.");
    await updateCategory(member.family_id, id, {
      name: clean,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
    });
  } catch (err) {
    return actionError(err);
  }
  refresh();
  return { ok: true };
}

export async function archiveCategoryAction(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  const { member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_categories");
    await setCategoryArchived(member.family_id, id, archived);
  } catch (err) {
    return actionError(err);
  }
  refresh();
  return { ok: true };
}
