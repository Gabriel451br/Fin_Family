import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listCategories } from "@/lib/data/categories";
import { PageHeader } from "@/components/page-header";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
  const { member } = await requireCurrentMember();
  const categories = (await listCategories(member.family_id))
    .filter((c) => c.kind === "expense" || c.kind === "income")
    .map((c) => ({ id: c.id, name: c.name, color: c.color, kind: c.kind as "expense" | "income" }));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Categorias"
        description="Sua lista personalizada para classificar receitas e despesas variáveis."
      />
      <CategoriesClient
        categories={categories}
        canManage={hasPermission(member, "manage_categories")}
      />
    </div>
  );
}
