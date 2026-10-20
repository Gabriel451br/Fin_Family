import Link from "next/link";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Fin Family</h1>
          <p className="mt-1 text-sm text-slate-500">
            Controle financeiro da sua família
          </p>
        </div>
        <LoginForm next={next} />
        <p className="mt-6 text-center text-sm text-slate-500">
          Ainda não tem conta?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
