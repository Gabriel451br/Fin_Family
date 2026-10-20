"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import type { Family } from "@/lib/types";
import { updateFamilySettingsAction, type SettingsFormState } from "./actions";

export default function SettingsClient({
  family,
  canManage,
}: {
  family: Family;
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(
    updateFamilySettingsAction,
    {},
  );

  return (
    <Card className="max-w-md">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome da família</Label>
          <Input id="name" name="name" defaultValue={family.name} disabled={!canManage} required />
        </div>
        <div>
          <Label htmlFor="currency">Moeda</Label>
          <Select id="currency" name="currency" defaultValue={family.currency} disabled={!canManage}>
            <option value="BRL">Real (BRL)</option>
            <option value="USD">Dólar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </Select>
        </div>
        {canManage ? (
          <>
            <FieldError>{state.error}</FieldError>
            {state.success && <p className="text-sm text-emerald-600">Salvo!</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Apenas administradores podem alterar essas configurações.
          </p>
        )}
      </form>
    </Card>
  );
}
