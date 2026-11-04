"use client";

import { useSyncExternalStore } from "react";

// The cart lives in the browser (localStorage) so it survives page refreshes.
// Prices stored here are ONLY for display. The server recalculates every price.

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  isVeg: boolean;
  quantity: number;
};

export type Cart = {
  restaurantId: string | null;
  restaurantSlug: string;
  restaurantName: string;
  items: CartItem[];
};

export type CartRestaurant = { id: string; slug: string; name: string };
export type CartProduct = { id: string; name: string; price: number; isVeg: boolean };

const STORAGE_KEY = "foodiego-cart-v1";
export const MAX_QTY = 20;
const MAX_LINES = 30;

const EMPTY_CART: Cart = { restaurantId: null, restaurantSlug: "", restaurantName: "", items: [] };

let cart: Cart = EMPTY_CART;
let loaded = false;
const listeners = new Set<() => void>();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Never trust what is in localStorage: check every field.
function sanitize(raw: unknown): Cart {
  if (!raw || typeof raw !== "object") return EMPTY_CART;
  const r = raw as Record<string, unknown>;
  if (typeof r.restaurantId !== "string" || !UUID.test(r.restaurantId)) return EMPTY_CART;
  if (!Array.isArray(r.items)) return EMPTY_CART;

  const items: CartItem[] = [];
  for (const it of r.items.slice(0, MAX_LINES)) {
    if (!it || typeof it !== "object") continue;
    const i = it as Record<string, unknown>;
    if (typeof i.menuItemId !== "string" || !UUID.test(i.menuItemId)) continue;
    if (typeof i.name !== "string" || typeof i.price !== "number" || !isFinite(i.price)) continue;
    const q = Math.floor(Number(i.quantity));
    if (!(q >= 1)) continue;
    items.push({
      menuItemId: i.menuItemId,
      name: i.name.slice(0, 100),
      price: i.price,
      isVeg: i.isVeg === true,
      quantity: Math.min(q, MAX_QTY),
    });
  }
  if (items.length === 0) return EMPTY_CART;
  return {
    restaurantId: r.restaurantId,
    restaurantSlug: typeof r.restaurantSlug === "string" ? r.restaurantSlug.slice(0, 100) : "",
    restaurantName: typeof r.restaurantName === "string" ? r.restaurantName.slice(0, 100) : "",
    items,
  };
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (text) cart = sanitize(JSON.parse(text));
  } catch {
    cart = EMPTY_CART;
  }
}

function commit(next: Cart) {
  cart = next.items.length === 0 ? EMPTY_CART : next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Storage can be blocked (private mode). The cart still works until refresh.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);

  // Keep several browser tabs in sync
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      cart = e.newValue ? sanitize(JSON.parse(e.newValue)) : EMPTY_CART;
    } catch {
      cart = EMPTY_CART;
    }
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => {
  load();
  return cart;
};
const getServerSnapshot = () => EMPTY_CART;

export function useCart(): Cart {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useCartCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return cart.items.reduce((sum, i) => sum + i.quantity, 0);
    },
    () => 0
  );
}

// ---------- Actions ----------

export function addItem(
  restaurant: CartRestaurant,
  product: CartProduct
): "ok" | "different_restaurant" {
  load();
  if (cart.restaurantId && cart.restaurantId !== restaurant.id) return "different_restaurant";

  const items = [...cart.items];
  const existing = items.findIndex((i) => i.menuItemId === product.id);
  if (existing >= 0) {
    items[existing] = {
      ...items[existing],
      quantity: Math.min(items[existing].quantity + 1, MAX_QTY),
    };
  } else {
    if (items.length >= MAX_LINES) return "ok";
    items.push({
      menuItemId: product.id,
      name: product.name,
      price: product.price,
      isVeg: product.isVeg,
      quantity: 1,
    });
  }
  commit({
    restaurantId: restaurant.id,
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    items,
  });
  return "ok";
}

export function replaceCart(restaurant: CartRestaurant, product: CartProduct) {
  commit({
    restaurantId: restaurant.id,
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    items: [
      { menuItemId: product.id, name: product.name, price: product.price, isVeg: product.isVeg, quantity: 1 },
    ],
  });
}

export function setQuantity(menuItemId: string, quantity: number) {
  load();
  const q = Math.floor(quantity);
  const items =
    q < 1
      ? cart.items.filter((i) => i.menuItemId !== menuItemId)
      : cart.items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity: Math.min(q, MAX_QTY) } : i
        );
  commit({ ...cart, items });
}

export function removeItem(menuItemId: string) {
  setQuantity(menuItemId, 0);
}

export function clearCart() {
  commit(EMPTY_CART);
}
