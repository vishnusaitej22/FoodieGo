"use client";

import { useEffect, useMemo, useState } from "react";
import type { Cart } from "@/lib/cart-store";
import type { Quote } from "@/lib/types";
import { quoteOrder } from "@/app/checkout/actions";

type Result = { key: string; quote?: Quote; error?: string };

// Asks the server what the cart really costs. Re-asks whenever the cart or coupon changes.
export function useQuote(cart: Cart, coupon: string) {
  const payload = useMemo(
    () =>
      cart.restaurantId
        ? {
            restaurantId: cart.restaurantId,
            items: cart.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
          }
        : null,
    [cart]
  );
  const key = JSON.stringify([payload, coupon]);
  const [result, setResult] = useState<Result>({ key: "" });

  useEffect(() => {
    if (!payload) return;
    let cancelled = false;
    quoteOrder(payload, coupon)
      .then((r) => {
        if (!cancelled) setResult({ key, ...r });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, error: "Could not load prices. Check your connection." });
      });
    return () => {
      cancelled = true;
    };
  }, [payload, coupon, key]);

  return {
    quote: result.quote,
    error: result.key === key ? result.error : undefined,
    loading: !!payload && result.key !== key,
  };
}
