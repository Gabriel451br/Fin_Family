import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listMembers } from "@/lib/data/members";
import { listInvites } from "@/lib/data/invites";
import { PageHeader } from "@/components/page-header";
import FamilyClient from "./family-client";

export default async function FamilyPage() {
  const { member } = await requireCurrentMember();
  const [members, invites] = await Promise.all([
    listMembers(member.family_id),
    listInvites(member.family_id),
  ]);

  return (
    <div>
      <PageHeader
        title="Família"
        description={`Membros e permissões de ${member.family.name}.`}
      />
      <FamilyClient
        members={members}
        invites={invites.filter((i) => i.status === "pending")}
        currentMemberId={member.id}
        canManage={hasPermission(member, "manage_members")}
      />
    </div>
  );
}
