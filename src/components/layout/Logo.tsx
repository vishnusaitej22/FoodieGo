import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="FoodieGo home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
        <UtensilsCrossed size={20} aria-hidden="true" />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-stone-900">
        Foodie<span className="text-orange-500">Go</span>
      </span>
    </Link>
  );
}
