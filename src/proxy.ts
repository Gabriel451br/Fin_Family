import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// Arquivos públicos (ícones e manifesto do app) não passam pela checagem de login:
// o iPhone busca o manifesto/ícone sem cookies ao "Adicionar à Tela de Início".
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|apple-icon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
