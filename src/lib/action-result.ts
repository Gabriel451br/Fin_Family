import { PermissionError } from "@/lib/permissions";

export interface ActionResult {
  ok?: boolean;
  error?: string;
}

export function actionError(err: unknown): ActionResult {
  if (err instanceof PermissionError) return { error: err.message };
  if (err instanceof Error) return { error: err.message };
  return { error: "Erro inesperado. Tente novamente." };
}
