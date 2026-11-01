import { Clock, Leaf, Star } from "lucide-react";
import type { Restaurant } from "@/lib/demo-data";

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-lg">
      {/* Image area: a colourful placeholder for now. Real photos come in Phase 5. */}
      <div
        className={`relative flex h-40 items-center justify-center text-6xl ${restaurant.gradient}`}
        aria-hidden="true"
      >
        {restaurant.emoji}
        {restaurant.offer && (
          <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-left text-sm font-bold text-white">
            {restaurant.offer}
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

        <p className="mt-1 text-sm text-stone-500">
          {restaurant.cuisines.join(", ")}
        </p>

        <div className="mt-3 flex items-center gap-3 text-xs text-stone-600">
          <span className="flex items-center gap-1">
            <Clock size={14} aria-hidden="true" />
            {restaurant.deliveryMinutes} mins
          </span>
          <span>Min order ₹{restaurant.minOrder}</span>
          {restaurant.isVeg && (
            <span className="flex items-center gap-1 font-medium text-green-700">
              <Leaf size={14} aria-hidden="true" />
              Pure Veg
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
