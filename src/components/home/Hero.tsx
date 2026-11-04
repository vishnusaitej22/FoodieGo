import { MapPin, Search } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-orange-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-12 text-center md:py-20">
        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 md:text-6xl">
          Hungry? Get it <span className="text-orange-500">delivered</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
          Order from your favourite restaurants and track every step, from the
          kitchen to your door.
        </p>

        {/* A plain GET form: it opens /restaurants?q=... (works without JavaScript) */}
        <form
          action="/restaurants"
          method="get"
          role="search"
          className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-stone-200 sm:flex-row"
        >
          <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 sm:border-r sm:border-stone-200">
            <MapPin size={20} className="text-orange-500" aria-hidden="true" />
            <span className="sr-only">Delivery location (coming soon)</span>
            <input
              type="text"
              placeholder="Delivery location"
              className="w-full bg-transparent text-stone-800 outline-none placeholder:text-stone-400"
            />
          </label>
          <label className="flex flex-[1.4] items-center gap-2 rounded-xl px-3 py-2">
            <Search size={20} className="text-stone-400" aria-hidden="true" />
            <span className="sr-only">Search for food or restaurants</span>
            <input
              type="search"
              name="q"
              maxLength={60}
              placeholder="Search restaurants or cuisines..."
              className="w-full bg-transparent text-stone-800 outline-none placeholder:text-stone-400"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
