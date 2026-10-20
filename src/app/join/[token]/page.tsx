import Link from "next/link";
import { getInviteByToken } from "@/lib/data/invites";
import { getAuthUser, getCurrentMember } from "@/lib/auth";
import { Badge } from "@/components/ui/card";
import AcceptInviteForm from "./accept-form";

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietário(a)",
  admin: "Administrador(a)",
  member: "Membro",
  viewer: "Apenas visualização",
};

export default async function JoinInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  const user = await getAuthUser();

  if (!invite) {
    return <Message title="Convite não encontrado">
      Verifique se o código foi copiado corretamente.
    </Message>;
  }

  if (invite.status === "revoked") {
    return <Message title="Convite cancelado">
      Esse convite foi cancelado. Peça para um administrador da família enviar um novo.
    </Message>;
  }
  if (invite.status === "expired") {
    return <Message title="Convite expirado">
      Esse convite expirou. Peça para um administrador da família enviar um novo.
    </Message>;
  }
  if (invite.status === "accepted") {
    return <Message title="Convite já utilizado">
      Esse convite já foi aceito. Faça login normalmente.
    </Message>;
  }

  if (!user) {
    return (
      <Message title={`Convite para ${invite.family_name}`}>
        <p className="mb-4">
          Você foi convidado(a) como <Badge color="blue">{ROLE_LABEL[invite.role]}</Badge>.
          Crie uma conta ou faça login com o email <strong>{invite.email}</strong> para aceitar.
        </p>
        <div className="flex gap-3">
          <Link
            href={`/signup?next=${encodeURIComponent(`/join/${token}`)}`}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Criar conta
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(`/join/${token}`)}`}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Entrar
          </Link>
        </div>
      </Message>
    );
  }

  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <Message title="Email diferente">
        Esse convite foi enviado para <strong>{invite.email}</strong>, mas você está
        logado(a) como <strong>{user.email}</strong>. Saia e entre com o email correto.
      </Message>
    );
  }

  const existingMember = await getCurrentMember(user.id);
  if (existingMember) {
    return (
      <Message title="Você já faz parte de uma família">
        Sua conta já está associada à família &ldquo;{existingMember.family.name}&rdquo;.
      </Message>
    );
  }

  return (
    <Message title={`Convite para ${invite.family_name}`}>
      <p className="mb-4 text-sm text-slate-600">
        Você foi convidado(a) como{" "}
        <Badge color="blue">{ROLE_LABEL[invite.role]}</Badge>.
      </p>
      <AcceptInviteForm token={token} defaultName={user.user_metadata?.display_name} />
    </Message>
  );
}

function Message({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-4 text-center text-xl font-bold text-slate-900">{title}</h1>
        <div className="text-center text-sm text-slate-600">{children}</div>
      </div>
    </div>
  );
}
