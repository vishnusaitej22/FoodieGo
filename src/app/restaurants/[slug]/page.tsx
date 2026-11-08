
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Star } from "lucide-react";
import {
  getCategories,
  getMenu,
  getRestaurantBySlug,
} from "@/lib/data";
import { formatINR, visualFor } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import AddToCartButton from "@/components/cart/AddToCartButton";

type Params = Promise<{ slug: string }>;

function VegMark({ isVeg }: { isVeg: boolean }) {
  const color = isVeg ? "border-green-600" : "border-red-600";
  const dot = isVeg ? "bg-green-600" : "bg-red-600";

  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 ${color}`}
      role="img"
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
    </span>
  );
}

async function RestaurantDetails({ params }: { params: Params }) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) notFound();

  const [menu, categories] = await Promise.all([
    getMenu(restaurant.id),
    getCategories(),
  ]);

  const visual = visualFor(restaurant.cuisines);

  // Group food items by category.
  const groups = new Map<string, MenuItem[]>();

  for (const item of menu) {
    const list = groups.get(item.categoryName) ?? [];
    list.push(item);
    groups.set(item.categoryName, list);
  }

  // Follow the category display order configured by the admin.
  const orderedGroups = [
    ...categories
      .filter((category) => groups.has(category.name))
      .map((category) => ({
        name: category.name,
        slug: category.slug,
        emoji: category.emoji,
        items: groups.get(category.name)!,
      })),
    ...(groups.has("Other")
      ? [{
          name: "Other",
          slug: "other",
          emoji: null,
          items: groups.get("Other")!,
        }]
      : []),
  ];

  return (
    <>
      <div className={`flex items-center gap-5 rounded-2xl p-6 ${visual.gradient}`}>
        <span className="text-6xl" aria-hidden="true">
          {visual.emoji}
        </span>

        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">
            {restaurant.name}
          </h1>
          <p className="mt-1 text-stone-800">
            {restaurant.cuisines.join(", ")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-700">
        <span className="flex items-center gap-1 rounded-md bg-green-600 px-2 py-0.5 font-bold text-white">
          <Star size={14} fill="currentColor" aria-hidden="true" />
          {restaurant.rating.toFixed(1)}
        </span>

        <span className="flex items-center gap-1">
          <Clock size={16} aria-hidden="true" />
          {restaurant.deliveryMinutes} mins (demo estimate)
        </span>

        <span>Min order {formatINR(restaurant.minOrder)}</span>

        <span>
          Delivery fee{" "}
          {restaurant.deliveryFee === 0
            ? "Free"
            : formatINR(restaurant.deliveryFee)}
        </span>

        {restaurant.offerText && (
          <span className="rounded-md bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">
            {restaurant.offerText}
          </span>
        )}
      </div>

      {restaurant.description && (
        <p className="mt-3 text-stone-600">{restaurant.description}</p>
      )}

      {menu.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-stone-50 p-8 text-center text-stone-500">
          This restaurant has no dishes yet.
        </p>
      ) : (
        <>
          {/* Category navigation */}
          <nav
            aria-label="Menu categories"
            className="sticky top-0 z-20 mt-8 border-b border-stone-200 bg-white py-3"
          >
            <div className="flex gap-3 overflow-x-auto">
              {orderedGroups.map((category) => (
                <a
                  key={category.slug}
                  href={`#menu-${category.slug}`}
                  className="shrink-0 rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700"
                >
                  {category.emoji ? `${category.emoji} ` : ""}
                  {category.name}
                </a>
              ))}
            </div>
          </nav>

          {/* Category sections and food items */}
          {orderedGroups.map((category) => (
            <section
              key={category.slug}
              id={`menu-${category.slug}`}
              className="mt-8 scroll-mt-24"
            >
              <h2 className="text-xl font-bold text-stone-900">
                {category.emoji ? `${category.emoji} ` : ""}
                {category.name}
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                {category.items.length}{" "}
                {category.items.length === 1 ? "item" : "items"}
              </p>

              <ul className="mt-3 divide-y divide-stone-200 rounded-2xl bg-white ring-1 ring-stone-200">
                {category.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 p-4"
                  >
                    <div className="flex min-w-0 flex-1 gap-4">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-24 w-24 shrink-0 rounded-xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-3xl">
                          🍽️
                        </div>
            )}

            <div className={item.isAvailable ? "" : "opacity-50"}>
              <div className="flex items-center gap-2">
                <VegMark isVeg={item.isVeg} />
                <h3 className="font-semibold text-stone-900">
                  {item.name}
                </h3>
              </div>

              <p className="mt-1 font-medium text-stone-800">
                {formatINR(item.price)}
              </p>

              {item.description && (
                <p className="mt-1 text-sm text-stone-500">
                  {item.description}
                </p>
              )}

              {!item.isAvailable && (
                <p className="mt-1 text-sm font-medium text-red-600">
                  Currently unavailable
                </p>
            )}
          </div>
        </div>

        <AddToCartButton
        restaurant={{
          id: restaurant.id,
          slug: restaurant.slug,
          name: restaurant.name,
        }}
        product={{
          id: item.id,
          name: item.name,
          price: item.price,
          isVeg: item.isVeg,
        }}
        isAvailable={item.isAvailable}
      />
    </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </>
  );
}

export default function RestaurantPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/restaurants"
        className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:underline"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        All restaurants
      </Link>

      <div className="mt-4">
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />
          }
        >
          <RestaurantDetails params={params} />
        </Suspense>
      </div>
    </div>
  );
}
