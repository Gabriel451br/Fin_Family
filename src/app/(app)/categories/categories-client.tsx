"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { CATEGORY_KIND_LABELS, ACCOUNT_COLORS } from "@/lib/constants";
import type { Category, CategoryKind } from "@/lib/types";
import {
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryArchivedAction,
  type CategoryFormState,
} from "./actions";

const KINDS: CategoryKind[] = ["expense", "income", "investment"];

export default function CategoriesClient({
  categories,
  canManage,
}: {
  categories: Category[];
  canManage: boolean;
}) {
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [modalCategory, setModalCategory] = useState<Category | "new" | null>(null);

  const forKind = categories.filter((c) => c.kind === kind);
  const topLevel = forKind.filter((c) => !c.parent_id && !c.is_archived);
  const byParent = new Map<string, Category[]>();
  for (const c of forKind) {
    if (c.parent_id) {
      byParent.set(c.parent_id, [...(byParent.get(c.parent_id) ?? []), c]);
    }
  }
  const orphanArchived = forKind.filter((c) => c.is_archived && !c.parent_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                kind === k ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {CATEGORY_KIND_LABELS[k]}
            </button>
          ))}
        </div>
        {canManage && (
          <Button onClick={() => setModalCategory("new")}>
            <Plus className="h-4 w-4" /> Nova categoria
          </Button>
        )}
      </div>

      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {topLevel.map((category) => (
          <div key={category.id} className="p-4">
            <CategoryRow
              category={category}
              canManage={canManage}
              onEdit={() => setModalCategory(category)}
              onArchive={() => toggleCategoryArchivedAction(category.id, true)}
            />
            {(byParent.get(category.id) ?? []).map((sub) => (
              <div key={sub.id} className="ml-8 mt-2">
                <CategoryRow
                  category={sub}
                  canManage={canManage}
                  onEdit={() => setModalCategory(sub)}
                  onArchive={() =>
                    toggleCategoryArchivedAction(sub.id, !sub.is_archived)
                  }
                  archived={sub.is_archived}
                />
              </div>
            ))}
          </div>
        ))}
        {topLevel.length === 0 && (
          <p className="p-4 text-center text-sm text-slate-500">
            Nenhuma categoria de {CATEGORY_KIND_LABELS[kind].toLowerCase()} ainda.
          </p>
        )}
      </div>

      {orphanArchived.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Arquivadas ({orphanArchived.length})
          </summary>
          <div className="mt-3 space-y-2">
            {orphanArchived.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                canManage={canManage}
                onEdit={() => setModalCategory(category)}
                onArchive={() => toggleCategoryArchivedAction(category.id, false)}
                archived
              />
            ))}
          </div>
        </details>
      )}

      <Modal
        open={modalCategory !== null}
        onClose={() => setModalCategory(null)}
        title={modalCategory === "new" ? "Nova categoria" : "Editar categoria"}
      >
        {modalCategory && (
          <CategoryForm
            category={modalCategory === "new" ? null : modalCategory}
            kind={kind}
            parentOptions={topLevel}
            onDone={() => setModalCategory(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function CategoryRow({
  category,
  canManage,
  onEdit,
  onArchive,
  archived,
}: {
  category: Category;
  canManage: boolean;
  onEdit: () => void;
  onArchive: () => void;
  archived?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", archived && "opacity-50")}>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="text-sm font-medium text-slate-800">{category.name}</span>
        {category.is_default && <Badge>Padrão</Badge>}
      </div>
      {canManage && (
        <div className="flex gap-1">
          <button onClick={onEdit} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onArchive} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Arquivar">
            {archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  kind,
  parentOptions,
  onDone,
}: {
  category: Category | null;
  kind: CategoryKind;
  parentOptions: Category[];
  onDone: () => void;
}) {
  const action = category
    ? updateCategoryAction.bind(null, category.id)
    : createCategoryAction;
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(
    action,
    {},
  );
  const [color, setColor] = useState(category?.color ?? ACCOUNT_COLORS[0]);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="space-y-4"
    >
      {!category && <input type="hidden" name="kind" value={kind} />}
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={category?.name} required />
      </div>
      <div>
        <Label htmlFor="parent_id">Categoria pai (opcional)</Label>
        <Select id="parent_id" name="parent_id" defaultValue={category?.parent_id ?? ""}>
          <option value="">Nenhuma (categoria principal)</option>
          {parentOptions
            .filter((p) => p.id !== category?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </Select>
      </div>
      <div>
        <Label>Cor</Label>
        <input type="hidden" name="color" value={color} />
        <div className="flex gap-2">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
              }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
