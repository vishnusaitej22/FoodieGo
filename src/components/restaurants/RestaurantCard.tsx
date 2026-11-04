import Link from "next/link";
import { Clock, Leaf, Star } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { formatINR, visualFor } from "@/lib/format";

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const visual = visualFor(restaurant.cuisines);

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-orange-500"
    >
      <div
        className={`relative flex h-40 items-center justify-center text-6xl ${visual.gradient}`}
        aria-hidden="true"
      >
        {visual.emoji}
        {restaurant.offerText && (
          <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-left text-sm font-bold text-white">
            {restaurant.offerText}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-stone-900">{restaurant.name}</h3>
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-green-600 px-1.5 py-0.5 text-xs font-bold text-white">
            <Star size={12} fill="currentColor" aria-hidden="true" />
            {restaurant.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-sm text-stone-500">{restaurant.cuisines.join(", ")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
          <span className="flex items-center gap-1">
            <Clock size={14} aria-hidden="true" />
            {restaurant.deliveryMinutes} mins
          </span>
          <span>Min order {formatINR(restaurant.minOrder)}</span>
          {restaurant.isVeg && (
            <span className="flex items-center gap-1 font-medium text-green-700">
              <Leaf size={14} aria-hidden="true" />
              Pure Veg
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
