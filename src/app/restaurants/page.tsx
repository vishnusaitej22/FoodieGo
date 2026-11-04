import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { getCategories, getRestaurants } from "@/lib/data";
import {
  EmptyState,
  RestaurantGrid,
  RestaurantGridSkeleton,
} from "@/components/restaurants/RestaurantGrid";

export const metadata = { title: "Restaurants | FoodieGo" };

type SearchParams = Promise<{
  q?: string;
  cuisine?: string;
  veg?: string;
  rating?: string;
  offers?: string;
  sort?: string;
}>;

const SORTS = [
  { value: "rating", label: "Top rated" },
  { value: "delivery", label: "Fastest delivery" },
  { value: "minorder", label: "Lowest minimum order" },
  { value: "newest", label: "Newest" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams;
  const q = (p.q ?? "").slice(0, 60);
  const cuisine = (p.cuisine ?? "").slice(0, 40);
  const sort = SORTS.some((s) => s.value === p.sort) ? (p.sort as SortValue) : "rating";
  const minRating = ["3.5", "4", "4.5"].includes(p.rating ?? "") ? Number(p.rating) : undefined;

  const [categories, restaurants] = await Promise.all([
    getCategories(),
    getRestaurants({
      q,
      cuisine: cuisine || undefined,
      veg: p.veg === "1",
      minRating,
      offersOnly: p.offers === "1",
      sort,
    }),
  ]);

  return (
    <>
      <form method="get" role="search" className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <label className="flex items-center gap-2 rounded-xl border border-stone-300 px-3 py-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200">
          <Search size={18} className="text-stone-400" aria-hidden="true" />
          <span className="sr-only">Search restaurants or cuisines</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={60}
            placeholder="Search by restaurant or cuisine"
            className="w-full bg-transparent outline-none"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-stone-600">
            Cuisine
            <select
              name="cuisine"
              defaultValue={cuisine}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
            >
              <option value="">All cuisines</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-stone-600">
            Rating
            <select
              name="rating"
              defaultValue={minRating ? String(minRating) : ""}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
            >
              <option value="">Any rating</option>
              <option value="3.5">3.5+</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
            </select>
          </label>

          <label className="text-sm text-stone-600">
            Sort by
            <select
              name="sort"
              defaultValue={sort}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col justify-end gap-2 text-sm text-stone-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="veg" value="1" defaultChecked={p.veg === "1"} className="h-4 w-4 accent-green-600" />
              Pure veg only
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="offers" value="1" defaultChecked={p.offers === "1"} className="h-4 w-4 accent-orange-500" />
              Offers only
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600">
            Apply
          </button>
          <Link href="/restaurants" className="rounded-lg px-5 py-2 font-medium text-stone-600 hover:bg-stone-100">
            Clear all
          </Link>
        </div>
      </form>

      <p className="mt-6 text-sm text-stone-500" aria-live="polite">
        {restaurants.length} restaurant{restaurants.length === 1 ? "" : "s"} found
      </p>
      <div className="mt-3">
        {restaurants.length > 0 ? (
          <RestaurantGrid restaurants={restaurants} />
        ) : (
          <EmptyState
            title="No restaurants match your search"
            hint="Try a different word, or clear the filters."
          />
        )}
      </div>
    </>
  );
}

export default function RestaurantsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-stone-900">Restaurants</h1>
      <p className="mt-1 text-stone-600">Demo data: all restaurants are fictional.</p>
      <div className="mt-6">
        <Suspense fallback={<RestaurantGridSkeleton count={8} />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
