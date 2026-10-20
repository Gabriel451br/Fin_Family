import { sql } from "@/lib/db/client";
import { DEFAULT_PERMISSIONS, type Invite, type MemberRole } from "@/lib/types";

export async function listInvites(familyId: string): Promise<Invite[]> {
  return sql<Invite[]>`
    select * from fin_family.invites
    where family_id = ${familyId}
    order by created_at desc
  `;
}

export async function createInvite(params: {
  familyId: string;
  email: string;
  role: MemberRole;
  createdBy: string;
}): Promise<Invite> {
  const { familyId, email, role, createdBy } = params;

  const [existing] = await sql<{ id: string }[]>`
    select id from fin_family.family_members
    where family_id = ${familyId} and email = ${email}
  `;
  if (existing) {
    throw new Error("Esse email já é membro da família.");
  }

  await sql`
    update fin_family.invites
    set status = 'revoked'
    where family_id = ${familyId} and email = ${email} and status = 'pending'
  `;

  const [invite] = await sql<Invite[]>`
    insert into fin_family.invites (family_id, email, role, permissions, created_by)
    values (${familyId}, ${email}, ${role}, ${sql.json(DEFAULT_PERMISSIONS[role])}, ${createdBy})
    returning *
  `;
  return invite;
}

export async function revokeInvite(familyId: string, inviteId: string) {
  await sql`
    update fin_family.invites
    set status = 'revoked'
    where family_id = ${familyId} and id = ${inviteId} and status = 'pending'
  `;
}

export async function getInviteByToken(token: string): Promise<
  (Invite & { family_name: string }) | null
> {
  const rows = await sql<(Invite & { family_name: string })[]>`
    select i.*, f.name as family_name
    from fin_family.invites i
    join fin_family.families f on f.id = i.family_id
    where i.token = ${token}
  `;
  const invite = rows[0];
  if (!invite) return null;

  if (invite.status === "pending" && new Date(invite.expires_at) < new Date()) {
    await sql`update fin_family.invites set status = 'expired' where id = ${invite.id}`;
    invite.status = "expired";
  }

  return invite;
}

export async function acceptInvite(params: {
  token: string;
  userId: string;
  email: string;
  displayName: string;
}) {
  const invite = await getInviteByToken(params.token);
  if (!invite) throw new Error("Convite não encontrado.");
  if (invite.status !== "pending") {
    throw new Error("Esse convite não está mais disponível.");
  }

  await sql.begin(async (tx) => {
    await tx`
      insert into fin_family.family_members
        (family_id, user_id, display_name, email, role, permissions, status, invited_by, joined_at)
      values (
        ${invite.family_id}, ${params.userId}, ${params.displayName}, ${params.email},
        ${invite.role}, ${sql.json(invite.permissions ?? DEFAULT_PERMISSIONS[invite.role])},
        'active', ${invite.created_by}, now()
      )
      on conflict (family_id, user_id) do update
        set status = 'active', joined_at = now()
    `;

    await tx`
      update fin_family.invites
      set status = 'accepted', accepted_at = now()
      where id = ${invite.id}
    `;
  });

  return invite.family_id;
}
