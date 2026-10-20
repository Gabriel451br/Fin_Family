"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentMember } from "@/lib/auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { updateFamilySettings } from "@/lib/data/families";

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

export async function updateFamilySettingsAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const { member } = await requireCurrentMember();
  try {
    requirePermission(member, "manage_members");
    const name = String(formData.get("name") ?? "").trim();
    const currency = String(formData.get("currency") ?? "BRL");
    if (!name) throw new Error("Informe o nome da família.");

    await updateFamilySettings(member.family_id, { name, currency });
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    if (err instanceof Error) return { error: err.message };
    return { error: "Erro inesperado." };
  }
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
