"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { createInvite, revokeInvite } from "@/lib/data/invites";
import {
  resetMemberPermissionsToRoleDefault,
  updateMemberRoleAndPermissions,
  removeMember,
  countOwners,
  getMemberById,
} from "@/lib/data/members";
import type { MemberRole, Permissions } from "@/lib/types";

export interface InviteFormState {
  error?: string;
  success?: string;
}

export async function inviteMemberAction(
  _prevState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const { user, member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_members");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const role = String(formData.get("role") ?? "member") as MemberRole;
    if (!email) throw new Error("Informe o email.");
    if (role === "owner") throw new Error("Não é possível convidar como proprietário.");

    const invite = await createInvite({
      familyId: member.family_id,
      email,
      role,
      createdBy: user.id,
    });
    revalidatePath("/family");
    return { success: invite.token };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export async function revokeInviteAction(inviteId: string) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_members");
  await revokeInvite(member.family_id, inviteId);
  revalidatePath("/family");
}

export async function updateMemberRoleAction(memberId: string, role: MemberRole) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_members");
  if (role === "owner") throw new PermissionError("Não é possível promover a proprietário.");
  await resetMemberPermissionsToRoleDefault(member.family_id, memberId, role);
  revalidatePath("/family");
}

export async function updateMemberPermissionAction(
  memberId: string,
  key: keyof Permissions,
  value: boolean,
) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_members");
  const target = await getMemberById(member.family_id, memberId);
  if (!target) throw new Error("Membro não encontrado.");
  if (target.role === "owner") throw new PermissionError("Permissões do proprietário não podem ser alteradas.");

  const nextPermissions: Permissions = { ...target.permissions, [key]: value };
  await updateMemberRoleAndPermissions(member.family_id, memberId, target.role, nextPermissions);
  revalidatePath("/family");
}

export async function removeMemberAction(memberId: string) {
  const { member } = await requireCurrentMember();
  requirePermission(member, "manage_members");
  const target = await getMemberById(member.family_id, memberId);
  if (!target) return;
  if (target.role === "owner") {
    const owners = await countOwners(member.family_id);
    if (owners <= 1) throw new Error("A família precisa ter ao menos um proprietário.");
  }
  await removeMember(member.family_id, memberId);
  revalidatePath("/family");
}

function errorMessage(err: unknown) {
  if (err instanceof PermissionError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erro inesperado.";
}
