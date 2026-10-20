"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { createCategory, updateCategory, setCategoryArchived } from "@/lib/data/categories";
import type { CategoryKind } from "@/lib/types";

export interface CategoryFormState {
  error?: string;
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_categories");
    const name = String(formData.get("name") ?? "").trim();
    const kind = String(formData.get("kind") ?? "expense") as CategoryKind;
    const color = String(formData.get("color") ?? "#64748b");
    const parentId = String(formData.get("parent_id") ?? "") || null;
    if (!name) throw new Error("Informe o nome da categoria.");

    await createCategory({
      familyId: member.family_id,
      name,
      kind,
      color,
      icon: "tag",
      parentId,
      createdBy: user.id,
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath("/categories");
  return {};
}

export async function updateCategoryAction(
  categoryId: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_categories");
    const name = String(formData.get("name") ?? "").trim();
    const color = String(formData.get("color") ?? "#64748b");
    const parentId = String(formData.get("parent_id") ?? "") || null;
    if (!name) throw new Error("Informe o nome da categoria.");

    await updateCategory(member.family_id, categoryId, { name, color, icon: "tag", parentId });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  revalidatePath("/categories");
  return {};
}

export async function toggleCategoryArchivedAction(
  categoryId: string,
  archived: boolean,
) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_categories");
  await setCategoryArchived(member.family_id, categoryId, archived);
  revalidatePath("/categories");
}

function errorMessage(err: unknown) {
  if (err instanceof PermissionError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erro inesperado.";
}
