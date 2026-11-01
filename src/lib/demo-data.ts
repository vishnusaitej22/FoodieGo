// DEMONSTRATION DATA ONLY.
// These restaurants are fictional and are NOT real partners.
// In Phase 4-5 we will replace this file with real data from Supabase.

export type Category = {
  id: string;
  name: string;
  emoji: string;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisines: string[];
  rating: number; // demo rating
  deliveryMinutes: number; // demo estimate
  minOrder: number; // in INR
  isVeg: boolean; // pure vegetarian restaurant
  emoji: string;
  gradient: string; // full Tailwind class string (must be written out in full)
  offer?: string;
};

export const categories: Category[] = [
  { id: "biryani", name: "Biryani", emoji: "🍛" },
  { id: "pizza", name: "Pizza", emoji: "🍕" },
  { id: "burgers", name: "Burgers", emoji: "🍔" },
  { id: "south-indian", name: "South Indian", emoji: "🥞" },
  { id: "north-indian", name: "North Indian", emoji: "🍲" },
  { id: "desserts", name: "Desserts", emoji: "🍰" },
  { id: "beverages", name: "Beverages", emoji: "🥤" },
];

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "Spice Route Biryani",
    cuisines: ["Biryani", "North Indian"],
    rating: 4.5,
    deliveryMinutes: 35,
    minOrder: 199,
    isVeg: false,
    emoji: "🍛",
    gradient: "bg-gradient-to-br from-amber-200 to-orange-400",
    offer: "20% OFF up to ₹100",
  },
  {
    id: "2",
    name: "Tiffin Corner",
    cuisines: ["South Indian"],
    rating: 4.4,
    deliveryMinutes: 25,
    minOrder: 99,
    isVeg: true,
    emoji: "🥞",
    gradient: "bg-gradient-to-br from-yellow-200 to-amber-400",
  },
  {
    id: "3",
    name: "Slice of Napoli",
    cuisines: ["Pizza", "Italian"],
    rating: 4.2,
    deliveryMinutes: 40,
    minOrder: 249,
    isVeg: false,
    emoji: "🍕",
    gradient: "bg-gradient-to-br from-red-200 to-rose-400",
    offer: "Free delivery",
  },
  {
    id: "4",
    name: "Burger Barn",
    cuisines: ["Burgers", "Fast Food"],
    rating: 4.1,
    deliveryMinutes: 30,
    minOrder: 149,
    isVeg: false,
    emoji: "🍔",
    gradient: "bg-gradient-to-br from-orange-200 to-red-400",
  },
  {
    id: "5",
    name: "Dosa Darbar",
    cuisines: ["South Indian"],
    rating: 4.6,
    deliveryMinutes: 28,
    minOrder: 129,
    isVeg: true,
    emoji: "🥘",
    gradient: "bg-gradient-to-br from-lime-200 to-emerald-400",
    offer: "₹50 OFF above ₹299",
  },
  {
    id: "6",
    name: "Tandoor Tales",
    cuisines: ["North Indian", "Mughlai"],
    rating: 4.3,
    deliveryMinutes: 45,
    minOrder: 299,
    isVeg: false,
    emoji: "🍗",
    gradient: "bg-gradient-to-br from-rose-200 to-orange-400",
  },
  {
    id: "7",
    name: "Sweet Tooth Studio",
    cuisines: ["Desserts", "Beverages"],
    rating: 4.7,
    deliveryMinutes: 30,
    minOrder: 149,
    isVeg: true,
    emoji: "🍰",
    gradient: "bg-gradient-to-br from-pink-200 to-fuchsia-400",
  },
  {
    id: "8",
    name: "Green Bowl Kitchen",
    cuisines: ["North Indian", "Healthy"],
    rating: 4.0,
    deliveryMinutes: 35,
    minOrder: 179,
    isVeg: true,
    emoji: "🥗",
    gradient: "bg-gradient-to-br from-green-200 to-teal-400",
  },
];
