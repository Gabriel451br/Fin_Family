"use server";

import { redirect } from "next/navigation";
import { requireAuthUser } from "@/lib/auth";
import { acceptInvite } from "@/lib/data/invites";

export interface AcceptInviteState {
  error?: string;
}

export async function acceptInviteAction(
  token: string,
  _prevState: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const user = await requireAuthUser();
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!displayName) {
    return { error: "Informe seu nome." };
  }

  try {
    await acceptInvite({
      token,
      userId: user.id,
      email: user.email ?? "",
      displayName,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao aceitar convite." };
  }

  redirect("/dashboard");
}
