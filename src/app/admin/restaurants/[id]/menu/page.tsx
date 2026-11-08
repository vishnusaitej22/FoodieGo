
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import {
  createMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deactivateMenuItem,
} from "./actions";

export const instant = false;

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ message?: string; error?: string }>;

export default async function AdminMenuPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = await isCurrentUserAdmin();
  if (!admin) redirect("/");

  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const [{ data: restaurant, error: restaurantError }, { data: categories, error: categoryError }, { data: items, error: itemError }] =
    await Promise.all([
      supabase.from("restaurants").select("id, name, slug").eq("id", id).maybeSingle(),
      supabase.from("food_categories").select("id, name, emoji").eq("is_active", true).order("sort_order"),
      supabase
        .from("menu_items")
        .select("id, name, description, price, image_url, category_id, is_veg, is_available")
        .eq("restaurant_id", id)
        .eq("is_active", true)
        .order("name"),
    ]);

  if (restaurantError || categoryError || itemError) {
    throw new Error(
      restaurantError?.message || categoryError?.message || itemError?.message
    );
  }

  if (!restaurant) notFound();

  const menuItems = items ?? [];
  const foodCategories = categories ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/admin/restaurants"
        className="text-sm font-semibold text-orange-600 hover:underline"
      >
        ← Back to Restaurants
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">
            Manage Menu
          </h1>
          <p className="mt-1 text-stone-600">{restaurant.name}</p>
        </div>
        <Link
          href={`/restaurants/${restaurant.slug}`}
          className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-50"
        >
          View Customer Page →
        </Link>
      </div>

      {query.message && (
        <p className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-800">
          {query.message}
        </p>
      )}

      {query.error && (
        <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {query.error}
        </p>
      )}

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold text-stone-900">Add New Food Item</h2>

        <form action={createMenuItem} className="mt-5 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="restaurant_id" value={id} />

          <label className="text-sm font-semibold text-stone-700">
            Food Name *
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Paneer Butter Masala"
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Price (₹) *
            <input
              name="price"
              type="number"
              min="0.01"
              max="100000"
              step="0.01"
              required
              placeholder="220"
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Category
            <select
              name="category_id"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-3 font-normal"
            >
              <option value="">Other / No category</option>
              {foodCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.emoji ? `${category.emoji} ` : ""}
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Image URL
            <input
              name="image_url"
              type="url"
              placeholder="https://example.com/food.jpg"
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700 sm:col-span-2">
            Description
            <textarea
              name="description"
              maxLength={300}
              rows={2}
              placeholder="Describe the dish..."
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <div className="flex flex-wrap gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input type="checkbox" name="is_veg" defaultChecked />
              Vegetarian
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input type="checkbox" name="is_available" defaultChecked />
              Available for ordering
            </label>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700 sm:col-span-2"
          >
            + Add Food Item
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-stone-900">
          Existing Food Items ({menuItems.length})
        </h2>

        {menuItems.length === 0 ? (
          <p className="mt-4 rounded-xl bg-stone-50 p-6 text-center text-stone-500">
            No food items yet. Add your first dish using the form above.
          </p>
        ) : (
          <div className="mt-4 space-y-5">
            {menuItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-stone-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-stone-900">{item.name}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item.is_available
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>

                <form
                  action={updateMenuItem}
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                >
                  <input type="hidden" name="restaurant_id" value={id} />
                  <input type="hidden" name="item_id" value={item.id} />

                  <label className="text-sm font-semibold text-stone-700">
                    Food Name
                    <input
                      name="name"
                      required
                      maxLength={100}
                      defaultValue={item.name}
                      className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 font-normal"
                    />
                  </label>

                  <label className="text-sm font-semibold text-stone-700">
                    Price (₹)
                    <input
                      name="price"
                      type="number"
                      min="0.01"
                      max="100000"
                      step="0.01"
                      required
                      defaultValue={item.price}
                      className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 font-normal"
                    />
                  </label>

                  <label className="text-sm font-semibold text-stone-700">
                    Category
                    <select
                      name="category_id"
                      defaultValue={item.category_id ?? ""}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2.5 font-normal"
                    >
                      <option value="">Other / No category</option>
                      {foodCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.emoji ? `${category.emoji} ` : ""}
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-stone-700">
                    Image URL
                    <input
                      name="image_url"
                      type="url"
                      defaultValue={item.image_url ?? ""}
                      className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 font-normal"
                    />
                  </label>

                  <label className="text-sm font-semibold text-stone-700 sm:col-span-2">
                    Description
                    <textarea
                      name="description"
                      maxLength={300}
                      rows={2}
                      defaultValue={item.description ?? ""}
                      className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 font-normal"
                    />
                  </label>

                  <div className="flex flex-wrap gap-5 sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="is_veg"
                        defaultChecked={item.is_veg}
                      />
                      Vegetarian
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="is_available"
                        defaultChecked={item.is_available}
                      />
                      Available for ordering
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-700"
                  >
                    Save Changes
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
                  <form action={toggleMenuItemAvailability}>
                    <input type="hidden" name="restaurant_id" value={id} />
                    <input type="hidden" name="item_id" value={item.id} />
                    <input
                      type="hidden"
                      name="is_available"
                      value={String(!item.is_available)}
                    />
                    <button className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold hover:bg-stone-50">
                      {item.is_available ? "Mark Unavailable" : "Mark Available"}
                    </button>
                  </form>

                  <form action={deactivateMenuItem}>
                    <input type="hidden" name="restaurant_id" value={id} />
                    <input type="hidden" name="item_id" value={item.id} />
                    <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                      Remove Item
                    </button>
                  </form>

                  <span className="self-center text-sm text-stone-500">
                    Current price: {formatINR(Number(item.price))}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
