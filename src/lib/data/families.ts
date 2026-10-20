import { sql } from "@/lib/db/client";
import { DEFAULT_PERMISSIONS, type Family } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/data/seed-categories";

export async function createFamilyWithOwner(params: {
  userId: string;
  email: string;
  displayName: string;
  familyName: string;
  currency?: string;
}) {
  const { userId, email, displayName, familyName, currency = "BRL" } = params;

  const family = await sql.begin(async (tx) => {
    const [fam] = await tx<Family[]>`
      insert into fin_family.families (name, currency, created_by)
      values (${familyName}, ${currency}, ${userId})
      returning *
    `;

    await tx`
      insert into fin_family.family_members
        (family_id, user_id, display_name, email, role, permissions, status, joined_at)
      values (
        ${fam.id}, ${userId}, ${displayName}, ${email}, 'owner',
        ${sql.json(DEFAULT_PERMISSIONS.owner)}, 'active', now()
      )
    `;

    for (const cat of DEFAULT_CATEGORIES) {
      await tx`
        insert into fin_family.categories (family_id, name, kind, color, icon, is_default, created_by)
        values (${fam.id}, ${cat.name}, ${cat.kind}, ${cat.color}, ${cat.icon}, true, ${userId})
      `;
    }

    return fam;
  });

  return family;
}

export async function updateFamilySettings(
  familyId: string,
  data: { name: string; currency: string },
) {
  await sql`
    update fin_family.families
    set name = ${data.name}, currency = ${data.currency}, updated_at = now()
    where id = ${familyId}
  `;
}
