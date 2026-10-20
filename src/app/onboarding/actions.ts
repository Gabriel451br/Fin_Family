"use server";

import { redirect } from "next/navigation";
import { requireAuthUser, getCurrentMember } from "@/lib/auth";
import { createFamilyWithOwner } from "@/lib/data/families";

export interface CreateFamilyState {
  error?: string;
}

export async function createFamilyAction(
  _prevState: CreateFamilyState,
  formData: FormData,
): Promise<CreateFamilyState> {
  const user = await requireAuthUser();

  const existing = await getCurrentMember(user.id);
  if (existing) redirect("/dashboard");

  const familyName = String(formData.get("family_name") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "BRL");

  if (!familyName || !displayName) {
    return { error: "Preencha seu nome e o nome da família." };
  }

  await createFamilyWithOwner({
    userId: user.id,
    email: user.email ?? "",
    displayName,
    familyName,
    currency,
  });

  redirect("/dashboard");
}
