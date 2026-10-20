"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { signupAction, type SignupState } from "./actions";

export default function SignupForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(
    signupAction,
    {},
  );

  if (state.success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-800">
        Conta criada! Verifique seu email para confirmar o cadastro antes de
        entrar.
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="next" value={next ?? "/onboarding"} />
      <div>
        <Label htmlFor="name">Seu nome</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div>
        <Label htmlFor="password_confirm">Confirmar senha</Label>
        <Input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
