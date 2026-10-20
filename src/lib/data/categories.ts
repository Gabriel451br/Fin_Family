import { sql } from "@/lib/db/client";
import type { Category, CategoryKind } from "@/lib/types";

export async function listCategories(
  familyId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<Category[]> {
  if (includeArchived) {
    return sql<Category[]>`
      select * from fin_family.categories
      where family_id = ${familyId}
      order by kind asc, name asc
    `;
  }
  return sql<Category[]>`
    select * from fin_family.categories
    where family_id = ${familyId} and is_archived = false
    order by kind asc, name asc
  `;
}

export async function createCategory(data: {
  familyId: string;
  name: string;
  kind: CategoryKind;
  parentId?: string | null;
  color: string;
  icon: string;
  createdBy: string;
}) {
  const [category] = await sql<Category[]>`
    insert into fin_family.categories (family_id, name, kind, parent_id, color, icon, created_by)
    values (
      ${data.familyId}, ${data.name}, ${data.kind}, ${data.parentId ?? null},
      ${data.color}, ${data.icon}, ${data.createdBy}
    )
    returning *
  `;
  return category;
}

export async function updateCategory(
  familyId: string,
  categoryId: string,
  data: { name: string; color: string; icon: string; parentId?: string | null },
) {
  await sql`
    update fin_family.categories
    set name = ${data.name}, color = ${data.color}, icon = ${data.icon},
        parent_id = ${data.parentId ?? null}
    where family_id = ${familyId} and id = ${categoryId}
  `;
}

export async function setCategoryArchived(
  familyId: string,
  categoryId: string,
  archived: boolean,
) {
  await sql`
    update fin_family.categories
    set is_archived = ${archived}
    where family_id = ${familyId} and id = ${categoryId}
  `;
}
