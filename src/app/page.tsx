import { Suspense } from "react";
import Hero from "@/components/home/Hero";
import CategoryStrip, { CategoryStripSkeleton } from "@/components/home/CategoryStrip";
import { RestaurantSection, RestaurantSectionSkeleton } from "@/components/home/RestaurantSection";

export default function Home() {
  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-bold text-stone-900">What&apos;s on your mind?</h2>
        <Suspense fallback={<CategoryStripSkeleton />}>
          <CategoryStrip />
        </Suspense>
      </section>

      <Suspense fallback={<RestaurantSectionSkeleton title="Top-rated restaurants" />}>
        <RestaurantSection
          title="Top-rated restaurants"
          subtitle="Demo data: fictional restaurants and ratings."
          filters={{ sort: "rating" }}
          limit={4}
          seeAllHref="/restaurants"
        />
      </Suspense>

      <Suspense fallback={<RestaurantSectionSkeleton title="Special offers" />}>
        <RestaurantSection
          title="Special offers"
          filters={{ offersOnly: true }}
          limit={4}
          seeAllHref="/restaurants?offers=1"
        />
      </Suspense>

      <Suspense fallback={<RestaurantSectionSkeleton title="Recently added" />}>
        <RestaurantSection
          title="Recently added"
          filters={{ sort: "newest" }}
          limit={4}
          seeAllHref="/restaurants?sort=newest"
        />
      </Suspense>
    </>
  );
}
