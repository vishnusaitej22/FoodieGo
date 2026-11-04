export function formatINR(amount: number) {
  const whole = Number.isInteger(amount);
  return (
    "₹" +
    amount.toLocaleString("en-IN", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

// A colourful placeholder for restaurants that have no photo yet.
// (Class names are written out in full so Tailwind can find them.)
const VISUALS: Record<string, { emoji: string; gradient: string }> = {
  biryani: { emoji: "🍛", gradient: "bg-gradient-to-br from-amber-200 to-orange-400" },
  pizza: { emoji: "🍕", gradient: "bg-gradient-to-br from-red-200 to-rose-400" },
  burgers: { emoji: "🍔", gradient: "bg-gradient-to-br from-orange-200 to-red-400" },
  "south indian": { emoji: "🥞", gradient: "bg-gradient-to-br from-yellow-200 to-amber-400" },
  "north indian": { emoji: "🍲", gradient: "bg-gradient-to-br from-rose-200 to-orange-400" },
  desserts: { emoji: "🍰", gradient: "bg-gradient-to-br from-pink-200 to-fuchsia-400" },
  beverages: { emoji: "🥤", gradient: "bg-gradient-to-br from-sky-200 to-cyan-400" },
};

export function visualFor(cuisines: string[]) {
  const key = cuisines[0]?.toLowerCase() ?? "";
  return (
    VISUALS[key] ?? {
      emoji: "🍽️",
      gradient: "bg-gradient-to-br from-stone-200 to-stone-400",
    }
  );
}
