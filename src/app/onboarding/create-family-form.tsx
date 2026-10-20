"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { createFamilyAction, type CreateFamilyState } from "./actions";

export default function CreateFamilyForm({
  defaultName,
}: {
  defaultName?: string;
}) {
  const [state, formAction, pending] = useActionState<CreateFamilyState, FormData>(
    createFamilyAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <Label htmlFor="display_name">Seu nome</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={defaultName}
          required
        />
      </div>
      <div>
        <Label htmlFor="family_name">Nome da família</Label>
        <Input
          id="family_name"
          name="family_name"
          placeholder="Ex: Família Silva"
          required
        />
      </div>
      <div>
        <Label htmlFor="currency">Moeda</Label>
        <Select id="currency" name="currency" defaultValue="BRL">
          <option value="BRL">Real (BRL)</option>
          <option value="USD">Dólar (USD)</option>
          <option value="EUR">Euro (EUR)</option>
        </Select>
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Criando..." : "Criar família"}
      </Button>
    </form>
  );
}
