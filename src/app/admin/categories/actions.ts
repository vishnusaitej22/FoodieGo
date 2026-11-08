
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type CategoryInput = {
  name: string;
  slug: string;
  emoji: string;
  sort_order: number;
};

function validateCategory(formData: FormData): CategoryInput {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const emoji = String(formData.get("emoji") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!name || name.length > 60) {
    throw new Error("Category name must be between 1 and 60 characters.");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Use a valid slug, such as main-course.");
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be a non-negative whole number.");
  }

  return {
    name,
    slug,
    emoji,
    sort_order: sortOrder,
  };
}

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const admin = await isCurrentUserAdmin();

  if (!admin) redirect("/");
}

function refreshCategoryPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
}

export async function createCategory(formData: FormData) {
  try {
    await requireAdmin();

    const category = validateCategory(formData);
    const supabase = await createClient();

    const { error } = await supabase
      .from("food_categories")
      .insert({
        ...category,
        is_active: true,
      });

    if (error) throw error;

    refreshCategoryPages();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create category.";

    redirect(
      `/admin/categories?error=${encodeURIComponent(message)}`
    );
  }

  redirect(
    `/admin/categories?message=${encodeURIComponent("Category added successfully.")}`
  );
}

export async function updateCategory(formData: FormData) {
  try {
    await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();

    if (!id) throw new Error("Category ID is missing.");

    const category = validateCategory(formData);
    const supabase = await createClient();

    const { error } = await supabase
      .from("food_categories")
      .update(category)
      .eq("id", id);

    if (error) throw error;

    refreshCategoryPages();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update category.";

    redirect(
      `/admin/categories?error=${encodeURIComponent(message)}`
    );
  }

  redirect(
    `/admin/categories?message=${encodeURIComponent("Category updated successfully.")}`
  );
}

export async function toggleCategoryActive(formData: FormData) {
  try {
    await requireAdmin();

    const id = String(formData.get("id") ?? "").trim();
    const isActive = formData.get("is_active") === "true";

    if (!id) throw new Error("Category ID is missing.");

    const supabase = await createClient();

    const { error } = await supabase
      .from("food_categories")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) throw error;

    refreshCategoryPages();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not change category status.";

    redirect(
      `/admin/categories?error=${encodeURIComponent(message)}`
    );
  }

  redirect(
    `/admin/categories?message=${encodeURIComponent("Category status updated.")}`
  );
}
