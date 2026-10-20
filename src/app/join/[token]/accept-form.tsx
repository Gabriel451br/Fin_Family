"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { acceptInviteAction, type AcceptInviteState } from "./actions";

export default function AcceptInviteForm({
  token,
  defaultName,
}: {
  token: string;
  defaultName?: string;
}) {
  const boundAction = acceptInviteAction.bind(null, token);
  const [state, formAction, pending] = useActionState<AcceptInviteState, FormData>(
    boundAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <Label htmlFor="display_name">Como quer ser chamado(a)?</Label>
        <Input id="display_name" name="display_name" defaultValue={defaultName} required />
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Aceitar convite e entrar"}
      </Button>
    </form>
  );
}
