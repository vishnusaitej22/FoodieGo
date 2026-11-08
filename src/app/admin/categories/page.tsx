
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createCategory,
  updateCategory,
  toggleCategoryActive,
} from "./actions";

export const instant = false;

type SearchParams = Promise<{
  message?: string;
  error?: string;
}>;

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (!(await isCurrentUserAdmin())) redirect("/");

  const query = await searchParams;
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("food_categories")
    .select("id, name, slug, emoji, sort_order, is_active")
    .order("sort_order")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/admin"
          className="text-sm font-semibold text-orange-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-stone-900">
          Manage Food Categories
        </h1>

        <p className="mt-2 text-stone-600">
          Welcome, {user.fullName || user.email}. Add and organise restaurant
          menu categories.
        </p>
      </div>

      {query.message && (
        <p className="mb-5 rounded-lg bg-green-100 p-4 text-sm text-green-800">
          {query.message}
        </p>
      )}

      {query.error && (
        <p className="mb-5 rounded-lg bg-red-100 p-4 text-sm text-red-800">
          {query.error}
        </p>
      )}

      <section className="mb-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-bold text-stone-900">
          Add New Category
        </h2>

        <form action={createCategory} className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            Category Name
            <input
              name="name"
              required
              maxLength={60}
              placeholder="Example: Main Course"
              className="rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Category Slug
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="main-course"
              className="rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Emoji
            <input
              name="emoji"
              maxLength={20}
              placeholder="🍛"
              className="rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Display Order
            <input
              name="sort_order"
              type="number"
              min="0"
              step="1"
              defaultValue="0"
              required
              className="rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>

          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 sm:col-span-2"
          >
            Add Category
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-bold text-stone-900">
          Existing Categories ({categories?.length ?? 0})
        </h2>

        {!categories?.length ? (
          <p className="text-stone-500">No categories found.</p>
        ) : (
          <div className="space-y-5">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-lg border border-stone-200 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-stone-900">
                      {category.emoji || "🍽️"} {category.name}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {category.slug} · Display order: {category.sort_order}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      category.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <form
                  action={updateCategory}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={category.id} />

                  <input
                    name="name"
                    required
                    maxLength={60}
                    defaultValue={category.name}
                    className="rounded-lg border border-stone-300 px-3 py-2"
                  />

                  <input
                    name="slug"
                    required
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    defaultValue={category.slug}
                    className="rounded-lg border border-stone-300 px-3 py-2"
                  />

                  <input
                    name="emoji"
                    maxLength={20}
                    defaultValue={category.emoji ?? ""}
                    placeholder="Emoji"
                    className="rounded-lg border border-stone-300 px-3 py-2"
                  />

                  <input
                    name="sort_order"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={category.sort_order}
                    className="rounded-lg border border-stone-300 px-3 py-2"
                  />

                  <button
                    type="submit"
                    className="rounded-lg bg-stone-800 px-4 py-2 font-semibold text-white hover:bg-stone-900"
                  >
                    Save Changes
                  </button>
                </form>

                <form action={toggleCategoryActive} className="mt-3">
                  <input type="hidden" name="id" value={category.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={String(category.is_active)}
                  />
                  <button
                    type="submit"
                    className="text-sm font-semibold text-orange-600 hover:underline"
                  >
                    {category.is_active ? "Deactivate" : "Activate"} Category
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/restaurants"
          className="rounded-lg bg-stone-800 px-5 py-3 font-semibold text-white"
        >
          Manage Restaurants
        </Link>
      </div>
    </main>
  );
}
