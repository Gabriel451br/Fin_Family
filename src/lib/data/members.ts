import { sql } from "@/lib/db/client";
import { DEFAULT_PERMISSIONS, type FamilyMember, type MemberRole, type Permissions } from "@/lib/types";

export async function listMembers(familyId: string): Promise<FamilyMember[]> {
  return sql<FamilyMember[]>`
    select * from fin_family.family_members
    where family_id = ${familyId}
    order by case role when 'owner' then 0 when 'admin' then 1 when 'member' then 2 else 3 end, created_at asc
  `;
}

export async function getMemberById(
  familyId: string,
  memberId: string,
): Promise<FamilyMember | null> {
  const rows = await sql<FamilyMember[]>`
    select * from fin_family.family_members
    where family_id = ${familyId} and id = ${memberId}
  `;
  return rows[0] ?? null;
}

export async function updateMemberRoleAndPermissions(
  familyId: string,
  memberId: string,
  role: MemberRole,
  permissions: Permissions,
) {
  await sql`
    update fin_family.family_members
    set role = ${role}, permissions = ${sql.json(permissions)}
    where family_id = ${familyId} and id = ${memberId}
  `;
}

export async function resetMemberPermissionsToRoleDefault(
  familyId: string,
  memberId: string,
  role: MemberRole,
) {
  await sql`
    update fin_family.family_members
    set role = ${role}, permissions = ${sql.json(DEFAULT_PERMISSIONS[role])}
    where family_id = ${familyId} and id = ${memberId}
  `;
}

export async function removeMember(familyId: string, memberId: string) {
  await sql`
    delete from fin_family.family_members
    where family_id = ${familyId} and id = ${memberId} and role <> 'owner'
  `;
}

export async function countOwners(familyId: string) {
  const rows = await sql<{ count: number }[]>`
    select count(*)::int as count from fin_family.family_members
    where family_id = ${familyId} and role = 'owner'
  `;
  return rows[0]?.count ?? 0;
}
