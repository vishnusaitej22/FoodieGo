import type { Restaurant } from "@/lib/demo-data";
import RestaurantCard from "./RestaurantCard";

type Props = {
  id?: string;
  title: string;
  subtitle?: string;
  restaurants: Restaurant[];
};

export default function RestaurantSection({ id, title, subtitle, restaurants }: Props) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-8">
      <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </section>
  );
}
