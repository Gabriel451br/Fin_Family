import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const { member } = await requireCurrentMember();

  return (
    <div>
      <PageHeader title="Configurações" description="Preferências gerais da família." />
      <SettingsClient
        family={member.family}
        canManage={hasPermission(member, "manage_members")}
      />
    </div>
  );
}
