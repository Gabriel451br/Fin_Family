import Link from "next/link";
import SignupForm from "./signup-form";

export default async function SignupPage({
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
          <p className="mt-1 text-sm text-slate-500">Crie sua conta</p>
        </div>
        <SignupForm next={next} />
        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link
            href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-blue-600 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
