import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuthUser, getCurrentMember } from "@/lib/auth";
import CreateFamilyForm from "./create-family-form";

export default async function OnboardingPage() {
  const user = await requireAuthUser();
  const existing = await getCurrentMember(user.id);
  if (existing) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Bem-vindo(a)!</h1>
          <p className="mt-1 text-sm text-slate-500">
            Crie a conta conjunta da sua família para começar a controlar as
            finanças juntos.
          </p>
        </div>

        <CreateFamilyForm defaultName={user.user_metadata?.display_name ?? ""} />

        <p className="mt-6 text-center text-sm text-slate-500">
          Recebeu um convite por email?{" "}
          <Link href="/join" className="font-medium text-blue-600 hover:underline">
            Inserir código de convite
          </Link>
        </p>
      </div>
    </div>
  );
}
