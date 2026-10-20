import { requireCurrentMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { member } = await requireCurrentMember();

  return (
    <AppShell familyName={member.family.name} memberName={member.display_name}>
      {children}
    </AppShell>
  );
}
