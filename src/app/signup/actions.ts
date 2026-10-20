"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SignupState {
  error?: string;
  success?: boolean;
}

export async function signupAction(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const next = String(formData.get("next") ?? "/onboarding");

  if (!name || !email || !password) {
    return { error: "Preencha todos os campos." };
  }
  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." };
  }
  if (password !== passwordConfirm) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Já existe uma conta com esse email." };
    }
    return { error: "Não foi possível criar a conta. Tente novamente." };
  }

  // Se a confirmação de email estiver desativada no projeto, já vem com sessão.
  if (data.session) {
    redirect(next || "/onboarding");
  }

  return { success: true };
}
