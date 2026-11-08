
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type MenuInput = {
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function readMenuItem(formData: FormData): MenuInput {
  const restaurant_id = field(formData, "restaurant_id");
  const name = field(formData, "name");
  const description = field(formData, "description");
  const category_id = field(formData, "category_id");
  const image_url = field(formData, "image_url");
  const price = Number(field(formData, "price"));

  if (!restaurant_id) throw new Error("Restaurant is required.");
  if (!name || name.length > 100) {
    throw new Error("Food name is required and must be under 100 characters.");
  }
  if (!Number.isFinite(price) || price <= 0 || price > 100000) {
    throw new Error("Enter a valid price greater than 0.");
  }
  if (description.length > 300) {
    throw new Error("Description must be under 300 characters.");
  }

  return {
    restaurant_id,
    category_id: category_id || null,
    name,
    description: description || null,
    price,
    image_url: image_url || null,
    is_veg: formData.get("is_veg") === "on",
    is_available: formData.get("is_available") === "on",
  };
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = await isCurrentUserAdmin();
  if (!admin) redirect("/");

  return createClient();
}

function refreshMenuPages(restaurantId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  revalidatePath(`/admin/restaurants/${restaurantId}/menu`);
  revalidatePath("/restaurants");
  revalidatePath("/restaurants/[slug]", "page");
}

export async function createMenuItem(formData: FormData) {
  let restaurantId = field(formData, "restaurant_id");

  try {
    const supabase = await requireAdmin();
    const item = readMenuItem(formData);
    restaurantId = item.restaurant_id;

    const { error } = await supabase.from("menu_items").insert({
      ...item,
      is_active: true,
    });

    if (error) throw error;

    refreshMenuPages(restaurantId);
    redirect(`/admin/restaurants/${restaurantId}/menu?message=Food item added`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;

    const message = error instanceof Error ? error.message : "Could not add food item.";
    redirect(`/admin/restaurants/${restaurantId}/menu?error=${encodeURIComponent(message)}`);
  }
}

export async function updateMenuItem(formData: FormData) {
  const restaurantId = field(formData, "restaurant_id");

  try {
    const supabase = await requireAdmin();
    const itemId = field(formData, "item_id");
    const item = readMenuItem(formData);

    if (!itemId) throw new Error("Food item ID is missing.");

    const { error } = await supabase
      .from("menu_items")
      .update({
        category_id: item.category_id,
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image_url,
        is_veg: item.is_veg,
        is_available: item.is_available,
      })
      .eq("id", itemId)
      .eq("restaurant_id", item.restaurant_id)
      .eq("is_active", true);

    if (error) throw error;

    refreshMenuPages(restaurantId);
    redirect(`/admin/restaurants/${restaurantId}/menu?message=Food item updated`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;

    const message = error instanceof Error ? error.message : "Could not update food item.";
    redirect(`/admin/restaurants/${restaurantId}/menu?error=${encodeURIComponent(message)}`);
  }
}

export async function toggleMenuItemAvailability(formData: FormData) {
  const restaurantId = field(formData, "restaurant_id");

  try {
    const supabase = await requireAdmin();
    const itemId = field(formData, "item_id");
    const available = field(formData, "is_available") === "true";

    if (!itemId || !restaurantId) throw new Error("Missing food item details.");

    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: available })
      .eq("id", itemId)
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true);

    if (error) throw error;

    refreshMenuPages(restaurantId);
    redirect(`/admin/restaurants/${restaurantId}/menu?message=Availability updated`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;

    const message = error instanceof Error ? error.message : "Could not update availability.";
    redirect(`/admin/restaurants/${restaurantId}/menu?error=${encodeURIComponent(message)}`);
  }
}

export async function deactivateMenuItem(formData: FormData) {
  const restaurantId = field(formData, "restaurant_id");

  try {
    const supabase = await requireAdmin();
    const itemId = field(formData, "item_id");

    if (!itemId || !restaurantId) throw new Error("Missing food item details.");

    const { error } = await supabase
      .from("menu_items")
      .update({ is_active: false })
      .eq("id", itemId)
      .eq("restaurant_id", restaurantId);

    if (error) throw error;

    refreshMenuPages(restaurantId);
    redirect(`/admin/restaurants/${restaurantId}/menu?message=Food item removed`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;

    const message = error instanceof Error ? error.message : "Could not remove food item.";
    redirect(`/admin/restaurants/${restaurantId}/menu?error=${encodeURIComponent(message)}`);
  }
}
