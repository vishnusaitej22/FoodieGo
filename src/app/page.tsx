import Hero from "@/components/home/Hero";
import CategoryStrip from "@/components/home/CategoryStrip";
import RestaurantSection from "@/components/home/RestaurantSection";
import { restaurants } from "@/lib/demo-data";

export default function Home() {
  const topRated = [...restaurants]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);
  const withOffers = restaurants.filter((r) => r.offer);

  return (
    <>
      <Hero />
      <CategoryStrip />
      <RestaurantSection
        id="restaurants"
        title="Top-rated restaurants"
        subtitle="Demo data: fictional restaurants and ratings."
        restaurants={topRated}
      />
      <RestaurantSection
        id="offers"
        title="Special offers"
        restaurants={withOffers}
      />
      <RestaurantSection title="All restaurants" restaurants={restaurants} />
    </>
  );
}
