"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type RestaurantInput = {
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  cuisines: string[];
  rating: number;
  delivery_minutes: number;
  min_order: number;
  delivery_fee: number;
  is_veg: boolean;
  offer_text: string | null;
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readRestaurant(formData: FormData): RestaurantInput {
  const name = field(formData, "name");
  const slug = field(formData, "slug").toLowerCase();
  const description = field(formData, "description");
  const imageUrl = field(formData, "image_url");
  const offerText = field(formData, "offer_text");
  const cuisines = field(formData, "cuisines")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const rating = Number(field(formData, "rating"));
  const deliveryMinutes = Number(field(formData, "delivery_minutes"));
  const minOrder = Number(field(formData, "min_order"));
  const deliveryFee = Number(field(formData, "delivery_fee"));

  if (!name || name.length > 100) {
    throw new Error("Restaurant name is required and must be 100 characters or fewer.");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and single hyphens.");
  }

  if (description.length > 500 || offerText.length > 100) {
    throw new Error("Description or offer text is too long.");
  }

  if (
    !Number.isFinite(rating) || rating < 0 || rating > 5 ||
    !Number.isInteger(deliveryMinutes) || deliveryMinutes < 5 || deliveryMinutes > 180 ||
    !Number.isFinite(minOrder) || minOrder < 0 ||
    !Number.isFinite(deliveryFee) || deliveryFee < 0
  ) {
    throw new Error("Please enter valid rating, delivery time, minimum order, and delivery fee values.");
  }

  if (cuisines.length > 20 || cuisines.some((cuisine) => cuisine.length > 40)) {
    throw new Error("Please enter up to 20 cuisines, each 40 characters or fewer.");
  }

  return {
    name,
    slug,
    description: description || null,
    image_url: imageUrl || null,
    cuisines,
    rating,
    delivery_minutes: deliveryMinutes,
    min_order: minOrder,
    delivery_fee: deliveryFee,
    is_veg: formData.get("is_veg") === "on",
    offer_text: offerText || null,
  };
}

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (!(await isCurrentUserAdmin())) redirect("/");

  return createClient();
}

function refreshRestaurantPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  revalidatePath("/restaurants");
  revalidatePath("/restaurants/[slug]", "page");
}

export async function createRestaurant(formData: FormData) {
  const supabase = await requireAdmin();

  let restaurant: RestaurantInput;

  try {
    restaurant = readRestaurant(formData);
  } catch (error) {
    redirect(
      `/admin/restaurants?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Invalid restaurant details."
      )}`
    );
  }

  const { error } = await supabase.from("restaurants").insert({
    ...restaurant,
    is_active: true,
    is_demo: true,
  });

  if (error) {
    redirect(
      `/admin/restaurants?error=${encodeURIComponent(error.message)}`
    );
  }

  refreshRestaurantPages();
  redirect("/admin/restaurants?message=Restaurant%20added%20successfully");
}

export async function updateRestaurant(formData: FormData) {
  const supabase = await requireAdmin();
  const id = field(formData, "id");

  if (!id) {
    redirect("/admin/restaurants?error=Missing%20restaurant%20ID");
  }

  let restaurant: RestaurantInput;

  try {
    restaurant = readRestaurant(formData);
  } catch (error) {
    redirect(
      `/admin/restaurants?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Invalid restaurant details."
      )}`
    );
  }

  const { error } = await supabase
    .from("restaurants")
    .update(restaurant)
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/restaurants?error=${encodeURIComponent(error.message)}`
    );
  }

  refreshRestaurantPages();
  redirect("/admin/restaurants?message=Restaurant%20updated%20successfully");
}

export async function toggleRestaurantActive(formData: FormData) {
  const supabase = await requireAdmin();
  const id = field(formData, "id");
  const nextActive = field(formData, "next_active") === "true";

  if (!id) {
    redirect("/admin/restaurants?error=Missing%20restaurant%20ID");
  }

  const { error } = await supabase
    .from("restaurants")
    .update({ is_active: nextActive })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/restaurants?error=${encodeURIComponent(error.message)}`
    );
  }

  refreshRestaurantPages();
  redirect(
    `/admin/restaurants?message=${encodeURIComponent(
      nextActive ? "Restaurant activated" : "Restaurant deactivated"
    )}`
  );
}