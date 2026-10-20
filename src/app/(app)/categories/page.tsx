import { requireCurrentMember } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listCategories } from "@/lib/data/categories";
import { PageHeader } from "@/components/page-header";
import CategoriesClient from "./categories-client";

export default async function CategoriesPage() {
  const { member } = await requireCurrentMember();
  const categories = await listCategories(member.family_id, { includeArchived: true });

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Organize despesas, receitas e investimentos do jeito da sua família."
      />
      <CategoriesClient
        categories={categories}
        canManage={hasPermission(member, "manage_categories")}
      />
    </div>
  );
}
