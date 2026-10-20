import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sql } from "@/lib/db/client";
import type { Family, FamilyMember } from "@/lib/types";

export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export async function requireAuthUser() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

export interface CurrentMember extends FamilyMember {
  family: Family;
}

/** Primeira família ativa do usuário logado (MVP: 1 família por usuário). */
export const getCurrentMember = cache(
  async (userId: string): Promise<CurrentMember | null> => {
    const rows = await sql<CurrentMember[]>`
      select
        fm.*,
        to_jsonb(f.*) as family
      from fin_family.family_members fm
      join fin_family.families f on f.id = fm.family_id
      where fm.user_id = ${userId} and fm.status = 'active'
      order by fm.created_at asc
      limit 1
    `;
    return rows[0] ?? null;
  },
);

export const requireCurrentMember = cache(async () => {
  const user = await requireAuthUser();
  const member = await getCurrentMember(user.id);
  if (!member) redirect("/onboarding");
  return { user, member };
});
