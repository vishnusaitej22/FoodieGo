import { createClient } from "@/lib/supabase/server";
import type { Category, MenuItem, Restaurant } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toRestaurant(row: any): Restaurant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    cuisines: row.cuisines ?? [],
    rating: Number(row.rating),
    deliveryMinutes: row.delivery_minutes,
    minOrder: Number(row.min_order),
    deliveryFee: Number(row.delivery_fee),
    isVeg: row.is_veg,
    offerText: row.offer_text,
    createdAt: row.created_at,
  };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_categories")
    .select("id, name, slug, emoji")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error("Could not load categories: " + error.message);
  return (data ?? []) as Category[];
}

export type RestaurantFilters = {
  q?: string;
  cuisine?: string;
  veg?: boolean;
  minRating?: number;
  offersOnly?: boolean;
  sort?: "rating" | "delivery" | "newest" | "minorder";
};

// The dataset is small, so we load active restaurants and filter in code.
// (When the list grows to hundreds, we would move this into the database.)
export async function getRestaurants(
  filters: RestaurantFilters = {}
): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .limit(200);
  if (error) throw new Error("Could not load restaurants: " + error.message);

  let list = (data ?? []).map(toRestaurant);

  const q = filters.q?.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisines.some((c) => c.toLowerCase().includes(q))
    );
  }
  if (filters.cuisine) {
    const c = filters.cuisine.toLowerCase();
    list = list.filter((r) => r.cuisines.some((x) => x.toLowerCase() === c));
  }
  if (filters.veg) list = list.filter((r) => r.isVeg);
  if (filters.minRating) list = list.filter((r) => r.rating >= filters.minRating!);
  if (filters.offersOnly) list = list.filter((r) => !!r.offerText);

  switch (filters.sort) {
    case "delivery":
      list.sort((a, b) => a.deliveryMinutes - b.deliveryMinutes);
      break;
    case "minorder":
      list.sort((a, b) => a.minOrder - b.minOrder);
      break;
    case "newest":
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    default:
      list.sort((a, b) => b.rating - a.rating);
  }
  return list;
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error("Could not load restaurant: " + error.message);
  return data ? toRestaurant(data) : null;
}

export async function getMenu(restaurantId: string): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(
      "id, name, description, price, image_url, is_veg, is_available, food_categories(name, sort_order)"
    )
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error("Could not load menu: " + error.message);

  return (data ?? []).map((row: any) => {
    const cat = Array.isArray(row.food_categories)
      ? row.food_categories[0]
      : row.food_categories;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      imageUrl: row.image_url,
      isVeg: row.is_veg,
      isAvailable: row.is_available,
      categoryName: cat?.name ?? "Other",
    };
  });
}
