import { categories } from "@/lib/demo-data";

export default function CategoryStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="text-2xl font-bold text-stone-900">What&apos;s on your mind?</h2>
      <ul className="mt-5 flex gap-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <li key={category.id} className="shrink-0">
            <button
              type="button"
              className="group flex w-24 flex-col items-center gap-2 rounded-2xl p-2 hover:bg-orange-50"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl transition-transform group-hover:scale-105">
                {category.emoji}
              </span>
              <span className="text-sm font-medium text-stone-700">
                {category.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
