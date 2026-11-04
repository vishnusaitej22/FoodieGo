import Link from "next/link";
import { getCategories } from "@/lib/data";

export default async function CategoryStrip() {
  const categories = await getCategories();

  return (
    <ul className="mt-5 flex gap-4 overflow-x-auto pb-2">
      {categories.map((category) => (
        <li key={category.id} className="shrink-0">
          <Link
            href={`/restaurants?cuisine=${encodeURIComponent(category.name)}`}
            className="group flex w-24 flex-col items-center gap-2 rounded-2xl p-2 hover:bg-orange-50"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl transition-transform group-hover:scale-105">
              {category.emoji ?? "🍽️"}
            </span>
            <span className="text-center text-sm font-medium text-stone-700">
              {category.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CategoryStripSkeleton() {
  return (
    <div className="mt-5 flex gap-4 overflow-hidden" aria-busy="true">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-stone-200" />
      ))}
    </div>
  );
}
