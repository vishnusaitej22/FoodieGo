import Link from "next/link";
import { getRestaurants, type RestaurantFilters } from "@/lib/data";
import { RestaurantGrid, RestaurantGridSkeleton, EmptyState } from "@/components/restaurants/RestaurantGrid";

type Props = {
  title: string;
  subtitle?: string;
  filters?: RestaurantFilters;
  limit?: number;
  seeAllHref?: string;
};

// Loads its own data. Wrap it in <Suspense> so the page can show a skeleton.
export async function RestaurantSection({ title, subtitle, filters, limit, seeAllHref }: Props) {
  const all = await getRestaurants(filters);
  const restaurants = limit ? all.slice(0, limit) : all;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
        </div>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-sm font-semibold text-orange-600 hover:underline">
            See all
          </Link>
        )}
      </div>
      <div className="mt-5">
        {restaurants.length > 0 ? (
          <RestaurantGrid restaurants={restaurants} />
        ) : (
          <EmptyState title="Nothing here yet" hint="Check back soon." />
        )}
      </div>
    </section>
  );
}

export function RestaurantSectionSkeleton({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
      <div className="mt-5">
        <RestaurantGridSkeleton />
      </div>
    </section>
  );
}
