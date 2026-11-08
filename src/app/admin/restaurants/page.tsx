
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createRestaurant,
  updateRestaurant,
  toggleRestaurantActive,
} from "./actions";

export const instant = false;

type SearchParams = Promise<{
  message?: string;
  error?: string;
}>;

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = await isCurrentUserAdmin();
  if (!admin) redirect("/");

  const query = await searchParams;
  const supabase = await createClient();

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("name");

  if (error) {
    throw new Error("Could not load restaurants: " + error.message);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm font-semibold text-orange-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-3 text-3xl font-extrabold text-stone-900">
            Manage Restaurants
          </h1>

          <p className="mt-2 text-stone-600">
            Add, edit, activate, deactivate and manage restaurant menus.
          </p>
        </div>

        <Link
          href="/restaurants"
          className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-50"
        >
          View Customer Website →
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

      {/* Add Restaurant */}
      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold text-stone-900">
          Add New Restaurant
        </h2>

        <form action={createRestaurant} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-stone-700">
            Restaurant Name *
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Spice Garden Kitchen"
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Slug *
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="spice-garden-kitchen"
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Cuisines (comma separated)
            <input
              name="cuisines"
              placeholder="North Indian, Biryani, Chinese"
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Image URL
            <input
              name="image_url"
              type="url"
              placeholder="https://example.com/restaurant.jpg"
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700 sm:col-span-2">
            Description
            <textarea
              name="description"
              maxLength={500}
              rows={2}
              placeholder="Describe your restaurant..."
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Offer Text
            <input
              name="offer_text"
              maxLength={100}
              placeholder="20% OFF on orders above ₹299"
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Rating
            <input
              name="rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              defaultValue="4.5"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Delivery Minutes
            <input
              name="delivery_minutes"
              type="number"
              min="5"
              max="180"
              defaultValue="30"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Minimum Order (₹)
            <input
              name="min_order"
              type="number"
              min="0"
              step="0.01"
              defaultValue="149"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-stone-700">
            Delivery Fee (₹)
            <input
              name="delivery_fee"
              type="number"
              min="0"
              step="0.01"
              defaultValue="30"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-stone-700 sm:col-span-2">
            <input type="checkbox" name="is_veg" />
            Pure Vegetarian Restaurant
          </label>

          <button
            type="submit"
            className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700 sm:col-span-2"
          >
            + Create Restaurant
          </button>
        </form>
      </section>

      {/* Existing Restaurants */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-stone-900">
          Existing Restaurants ({restaurants?.length ?? 0})
        </h2>

        {!restaurants?.length ? (
          <p className="mt-4 rounded-xl bg-stone-50 p-6 text-center text-stone-500">
            No restaurants found.
          </p>
        ) : (
          <div className="mt-5 space-y-6">
            {restaurants.map((restaurant) => (
              <article
                key={restaurant.id}
                className="rounded-2xl border border-stone-200 bg-white p-5"
              >
                {/* Restaurant heading */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">
                      {restaurant.name}
                    </h3>

                    <p className="mt-1 text-sm text-stone-500">
                      /restaurants/{restaurant.slug}
                    </p>

                    <p className="mt-1 text-sm text-stone-600">
                      {(restaurant.cuisines ?? []).join(", ")}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      restaurant.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {restaurant.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Restaurant actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/restaurants/${restaurant.id}/menu`}
                    className="inline-flex rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
                  >
                    Manage Menu →
                  </Link>

                  <Link
                    href={`/restaurants/${restaurant.slug}`}
                    className="inline-flex rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-50"
                  >
                    View Restaurant
                  </Link>

                  <form action={toggleRestaurantActive}>
                    <input
                      type="hidden"
                      name="restaurant_id"
                      value={restaurant.id}
                    />
                    <input
                      type="hidden"
                      name="is_active"
                      value={String(!restaurant.is_active)}
                    />

                    <button
                      type="submit"
                      className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-50"
                    >
                      {restaurant.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </div>

                {/* Edit Restaurant */}
                <details className="mt-5 border-t border-stone-100 pt-4">
                  <summary className="cursor-pointer text-sm font-bold text-stone-700 hover:text-orange-600">
                    Edit Restaurant Details
                  </summary>

                  <form
                    action={updateRestaurant}
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                  >
                    <input
                      type="hidden"
                      name="restaurant_id"
                      value={restaurant.id}
                    />

                    <label className="text-sm font-semibold text-stone-700">
                      Restaurant Name
                      <input
                        name="name"
                        required
                        maxLength={100}
                        defaultValue={restaurant.name}
                        className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
                      />
                    </label>

                    <label className="text-sm font-semibold text-stone-700">
                      Slug
                      <input
                        name="slug"
                        required
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        defaultValue={restaurant.slug}
                        className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
                      />
                    </label>

                    <label className="text-sm font-semibold text-stone-700">
                      Cuisines (comma separated)
                      <input
                        name="cuisines"
                        defaultValue={(restaurant.cuisines ?? []).join(", ")}
                        className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
                      />
                    </label>

                    <label className="text-sm font-semibold text-stone-700">
                      Image URL
                      <input
                        name="image_url"
                        type="url"
                        defaultValue={restaurant.image_url ?? ""}
                        className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
                      />
                    </label>

                    <label className="text-sm font-semibold text-stone-700 sm:col-span-2">
                      Description
                      <textarea
                        name="description"
                        maxLength={500}
                        rows={2}
                        defaultValue={restaurant.description ?? ""}
                        className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
                      />
                    </label>

                    <label className="text-sm font-semibold text-stone-700">
                      Offer Text
                      <input
                        name="offer_text"
                        maxLength={100}
                        defaultValue={restaurant.offer_text ?? ""}
                        className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
                      />
                    </label>

                    <label className="text-sm font-semibold text-stone-700">
                      Rating
                      <input
                        name="rating"
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        required
                        defaultValue={restaurant.rating}
                        className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
                      />
                    </label>

                    <label className="text-sm font-semibold text-stone-700">
                      Delivery Minutes
                      <input
                        name="delivery_minutes"
                        type="number"
                        min="5"
                        max="180"
                        required
                        defaultValue={restaurant.delivery_minutes}
                        className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
                      />
                    </label>

                    <label className="text-sm font-semibold text-stone-700">
                      Minimum Order (₹)
                      <input
                        name="min_order"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={restaurant.min_order}
                        className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
                      />
                    </label>

                    <label className="text-sm font-semibold text-stone-700">
                      Delivery Fee (₹)
                      <input
                        name="delivery_fee"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={restaurant.delivery_fee}
                        className="mt-1 w-full rounded-lg border border-stone-300 p-3 font-normal"
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm font-medium text-stone-700 sm:col-span-2">
                      <input
                        type="checkbox"
                        name="is_veg"
                        defaultChecked={restaurant.is_veg}
                      />
                      Pure Vegetarian Restaurant
                    </label>

                    <button
                      type="submit"
                      className="rounded-xl bg-stone-900 px-5 py-3 font-bold text-white hover:bg-stone-700 sm:col-span-2"
                    >
                      Save Restaurant Changes
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
