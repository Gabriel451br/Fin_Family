"use client";

import { useState } from "react";
import { Archive, Check, Pencil, Plus, X } from "lucide-react";
import { Input, FieldError } from "@/components/ui/field";
import {
  archiveCategoryAction,
  createCategoryAction,
  renameCategoryAction,
} from "./actions";

interface Item {
  id: string;
  name: string;
  color: string;
  kind: "expense" | "income";
}

const SECTIONS = [
  { kind: "expense" as const, title: "Despesas", dot: "bg-[#eb6834]" },
  { kind: "income" as const, title: "Receitas", dot: "bg-[#2a78d6]" },
];

export function CategoriesClient({
  categories,
  canManage,
}: {
  categories: Item[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => (
        <Section
          key={section.kind}
          {...section}
          items={categories.filter((c) => c.kind === section.kind)}
          canManage={canManage}
        />
      ))}
      {!canManage && (
        <p className="px-1 text-xs text-slate-500">
          Só administradores podem alterar a lista de categorias.
        </p>
      )}
    </div>
  );
}

function Section({
  kind,
  title,
  dot,
  items,
  canManage,
}: {
  kind: "expense" | "income";
  title: string;
  dot: string;
  items: Item[];
  canManage: boolean;
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<{ error?: string }>, after?: () => void) {
    setBusy(true);
    setError(null);
    const result = await fn();
    setBusy(false);
    if (result.error) setError(result.error);
    else after?.();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">{items.length}</span>
      </header>

      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {editingId === item.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={40}
                  autoFocus
                  className="h-9"
                />
                <button
                  type="button"
                  disabled={busy || !editName.trim()}
                  onClick={() =>
                    run(() => renameCategoryAction(item.id, editName), () => setEditingId(null))
                  }
                  className="rounded p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Salvar nome"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                  aria-label="Cancelar"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{item.name}</span>
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditName(item.name);
                      }}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                      aria-label={`Renomear ${item.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (
                          confirm(
                            `Tirar "${item.name}" da lista? Os lançamentos antigos continuam salvos.`,
                          )
                        ) {
                          run(() => archiveCategoryAction(item.id, true));
                        }
                      }}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                      aria-label={`Arquivar ${item.name}`}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </>
                )}
              </>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-5 text-center text-sm text-slate-500">Nenhuma categoria.</li>
        )}
      </ul>

      {canManage && (
        <form
          className="flex gap-2 border-t border-slate-100 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            run(() => createCategoryAction(kind, newName), () => setNewName(""));
          }}
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={kind === "expense" ? "Nova categoria de despesa" : "Nova categoria de receita"}
            maxLength={40}
          />
          <button
            type="submit"
            disabled={busy || !newName.trim()}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </form>
      )}
      <div className="px-4 pb-3 empty:hidden">
        <FieldError>{error}</FieldError>
      </div>
    </section>
  );
}
