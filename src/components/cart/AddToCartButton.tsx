"use client";

import { Minus, Plus } from "lucide-react";
import {
  addItem,
  replaceCart,
  setQuantity,
  useCart,
  MAX_QTY,
  type CartProduct,
  type CartRestaurant,
} from "@/lib/cart-store";

export default function AddToCartButton({
  restaurant,
  product,
  isAvailable,
}: {
  restaurant: CartRestaurant;
  product: CartProduct;
  isAvailable: boolean;
}) {
  const cart = useCart();
  const line =
    cart.restaurantId === restaurant.id
      ? cart.items.find((i) => i.menuItemId === product.id)
      : undefined;
  const quantity = line?.quantity ?? 0;

  if (!isAvailable) {
    return <span className="shrink-0 text-sm font-medium text-stone-400">Unavailable</span>;
  }

  function handleAdd() {
    const result = addItem(restaurant, product);
    if (result === "different_restaurant") {
      const ok = window.confirm(
        `Your cart has items from ${cart.restaurantName}. Start a new cart with ${restaurant.name}?`
      );
      if (ok) replaceCart(restaurant, product);
    }
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        className="shrink-0 rounded-lg border border-orange-500 px-5 py-1.5 text-sm font-bold text-orange-600 hover:bg-orange-50"
        aria-label={`Add ${product.name} to cart`}
      >
        ADD
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center rounded-lg border border-orange-500 text-orange-600">
      <button
        type="button"
        onClick={() => setQuantity(product.id, quantity - 1)}
        className="p-2 hover:bg-orange-50"
        aria-label={`Remove one ${product.name}`}
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <span className="min-w-6 text-center text-sm font-bold" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => setQuantity(product.id, quantity + 1)}
        disabled={quantity >= MAX_QTY}
        className="p-2 hover:bg-orange-50 disabled:opacity-40"
        aria-label={`Add one more ${product.name}`}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
