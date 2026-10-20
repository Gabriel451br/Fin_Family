import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

async function goToInvite(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "").trim();
  if (token) redirect(`/join/${token}`);
}

export default function JoinPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Entrar em uma família</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cole o código de convite que você recebeu por email.
          </p>
        </div>
        <form
          action={goToInvite}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <Label htmlFor="token">Código do convite</Label>
            <Input id="token" name="token" placeholder="00000000-0000-..." required />
          </div>
          <Button type="submit" className="w-full">
            Continuar
          </Button>
        </form>
      </div>
    </div>
  );
}
