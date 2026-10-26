import { Suspense } from "react";
import { CategoriesLoading } from "./_components/CategoriesLoading";
import { CategoriesManagement } from "./_components/CategoriesManagement";
import { getCategoriesPageData } from "./_lib/queries";

export default function AdminCategoriesPage() {
  return <Suspense fallback={<CategoriesLoading />}><CategoriesPageContent /></Suspense>;
}

async function CategoriesPageContent() {
  const { categories } = await getCategoriesPageData();
  return <CategoriesManagement categories={categories} />;
}
