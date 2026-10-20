"use client";

import { useActionState, useState } from "react";
import { Trash2, Copy, Check, UserPlus } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/constants";
import { PERMISSION_LABELS } from "@/lib/permissions";
import type { FamilyMember, Invite, MemberRole, Permissions } from "@/lib/types";
import {
  inviteMemberAction,
  revokeInviteAction,
  updateMemberRoleAction,
  updateMemberPermissionAction,
  removeMemberAction,
  type InviteFormState,
} from "./actions";

const EDITABLE_ROLES: MemberRole[] = ["admin", "member", "viewer"];

export default function FamilyClient({
  members,
  invites,
  currentMemberId,
  canManage,
}: {
  members: FamilyMember[];
  invites: Invite[];
  currentMemberId: string;
  canManage: boolean;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Membros</h2>
        <div className="space-y-3">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              isSelf={m.id === currentMemberId}
              canManage={canManage}
            />
          ))}
        </div>
      </section>

      {canManage && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Convidar membro</h2>
          <InviteForm />
        </section>
      )}

      {canManage && invites.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Convites pendentes</h2>
          <div className="space-y-2">
            {invites.map((invite) => (
              <InviteRow key={invite.id} invite={invite} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MemberRow({
  member,
  isSelf,
  canManage,
}: {
  member: FamilyMember;
  isSelf: boolean;
  canManage: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const canEditThis = canManage && member.role !== "owner";

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">
            {member.display_name} {isSelf && <span className="text-slate-400">(você)</span>}
          </p>
          <p className="text-sm text-slate-500">{member.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={member.role === "owner" ? "violet" : "blue"}>
            {ROLE_LABELS[member.role]}
          </Badge>
          {canEditThis && (
            <>
              <Button size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
                Permissões
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Remover ${member.display_name} da família?`)) {
                    removeMemberAction(member.id);
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {expanded && canEditThis && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="mb-3">
            <Label htmlFor={`role-${member.id}`}>Papel</Label>
            <Select
              id={`role-${member.id}`}
              defaultValue={member.role}
              onChange={(e) => updateMemberRoleAction(member.id, e.target.value as MemberRole)}
              className="max-w-xs"
            >
              {EDITABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(PERMISSION_LABELS) as Array<keyof Permissions>).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  defaultChecked={member.permissions[key]}
                  onChange={(e) => updateMemberPermissionAction(member.id, key, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                {PERMISSION_LABELS[key]}
              </label>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function InviteForm() {
  const [state, formAction, pending] = useActionState<InviteFormState, FormData>(
    inviteMemberAction,
    {},
  );
  const [copied, setCopied] = useState(false);
  const link =
    state.success && typeof window !== "undefined"
      ? `${window.location.origin}/join/${state.success}`
      : null;

  return (
    <Card>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="email">Email do convidado</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="w-40">
          <Label htmlFor="role">Papel</Label>
          <Select id="role" name="role" defaultValue="member">
            {EDITABLE_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          <UserPlus className="h-4 w-4" /> {pending ? "Enviando..." : "Convidar"}
        </Button>
      </form>
      <FieldError>{state.error}</FieldError>
      {link && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm">
          <span className="flex-1 truncate text-slate-700">{link}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado" : "Copiar link"}
          </button>
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Envie esse link para a pessoa convidada (por WhatsApp, email, etc.). O convite expira em 7 dias.
      </p>
    </Card>
  );
}

function InviteRow({ invite }: { invite: Invite }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{invite.email}</p>
        <p className="text-xs text-slate-500">
          {ROLE_LABELS[invite.role]} &middot; expira em {formatDate(invite.expires_at)}
        </p>
      </div>
      <Button size="sm" variant="ghost" onClick={() => revokeInviteAction(invite.id)}>
        Cancelar convite
      </Button>
    </Card>
  );
}
