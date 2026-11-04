"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { clearCart, MAX_QTY, removeItem, setQuantity, useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { issueMessage } from "@/lib/messages";
import { useQuote } from "./useQuote";
import OrderSummary from "./OrderSummary";

export default function CartView() {
  const cart = useCart();
  const { quote, error, loading } = useQuote(cart, "");

  if (cart.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
        <p className="text-5xl" aria-hidden="true">🛒</p>
        <h2 className="mt-3 text-xl font-bold text-stone-900">Your cart is empty</h2>
        <p className="mt-1 text-stone-500">Add some tasty dishes from a restaurant.</p>
        <Link
          href="/restaurants"
          className="mt-5 inline-block rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  const priceById = new Map(quote?.lines.map((l) => [l.menuItemId, l.unitPrice]));
  const unavailable = new Set(quote?.unavailableIds ?? []);
  const blockingIssues = (quote?.issues ?? []).filter((i) => i !== "login_required");
  const canCheckout = !!quote && !loading && blockingIssues.length === 0;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_340px]">
      <section>
        <div className="flex items-center justify-between">
          <p className="text-stone-600">
            Ordering from{" "}
            <Link href={`/restaurants/${cart.restaurantSlug}`} className="font-semibold text-orange-600 hover:underline">
              {cart.restaurantName}
            </Link>
          </p>
          <button
            type="button"
            onClick={() => clearCart()}
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-red-600"
          >
            <Trash2 size={14} aria-hidden="true" /> Clear cart
          </button>
        </div>

        <ul className="mt-3 divide-y divide-stone-200 rounded-2xl bg-white ring-1 ring-stone-200">
          {cart.items.map((item) => {
            const price = priceById.get(item.menuItemId) ?? item.price;
            const gone = unavailable.has(item.menuItemId);
            return (
              <li key={item.menuItemId} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold text-stone-900">{item.name}</p>
                  <p className="text-sm text-stone-600">{formatINR(price)} each</p>
                  {gone && (
                    <p className="text-sm font-medium text-red-600">
                      No longer available. Please remove it.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-lg border border-stone-300">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.menuItemId, item.quantity - 1)}
                      className="p-2 hover:bg-stone-100"
                      aria-label={`Remove one ${item.name}`}
                    >
                      <Minus size={14} aria-hidden="true" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.menuItemId, item.quantity + 1)}
                      disabled={item.quantity >= MAX_QTY}
                      className="p-2 hover:bg-stone-100 disabled:opacity-40"
                      aria-label={`Add one more ${item.name}`}
                    >
                      <Plus size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.menuItemId)}
                    className="text-stone-400 hover:text-red-600"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="space-y-3">
        <OrderSummary quote={quote} loading={loading} />
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {blockingIssues.map((code) => (
          <p key={code} role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {code === "below_min_order" && quote
              ? `Minimum order for this restaurant is ${formatINR(quote.minOrder)}. Please add more items.`
              : issueMessage(code)}
          </p>
        ))}
        {canCheckout ? (
          <Link
            href="/checkout"
            className="block w-full rounded-xl bg-orange-500 px-4 py-3 text-center font-bold text-white hover:bg-orange-600"
          >
            Proceed to checkout
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="block w-full cursor-not-allowed rounded-xl bg-stone-300 px-4 py-3 text-center font-bold text-white"
          >
            Proceed to checkout
          </span>
        )}
        <p className="text-xs text-stone-500">
          Prices are confirmed by our server when you check out. Payment: Cash on Delivery.
        </p>
      </aside>
    </div>
  );
}
