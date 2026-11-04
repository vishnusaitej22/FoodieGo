"use server";

import { createClient } from "@/lib/supabase/server";
import { orderErrorMessage } from "@/lib/messages";
import type { Quote } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CartInput = {
  restaurantId: string;
  items: { menuItemId: string; quantity: number }[];
};

// Anything that arrives from the browser is untrusted, so check its shape.
function parseCart(input: unknown): CartInput | null {
  if (!input || typeof input !== "object") return null;
  const r = input as Record<string, any>;
  if (typeof r.restaurantId !== "string" || !UUID.test(r.restaurantId)) return null;
  if (!Array.isArray(r.items) || r.items.length === 0 || r.items.length > 30) return null;

  const items: CartInput["items"] = [];
  for (const i of r.items) {
    if (!i || typeof i.menuItemId !== "string" || !UUID.test(i.menuItemId)) return null;
    if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 20) return null;
    items.push({ menuItemId: i.menuItemId, quantity: i.quantity });
  }
  return { restaurantId: r.restaurantId, items };
}

function cleanCoupon(coupon: unknown): string | null {
  if (typeof coupon !== "string") return null;
  const c = coupon.trim().toUpperCase().slice(0, 20);
  return c === "" ? null : c;
}

function toRpcItems(cart: CartInput) {
  return cart.items.map((i) => ({ menu_item_id: i.menuItemId, quantity: i.quantity }));
}

function mapQuote(q: any): Quote {
  return {
    restaurant: q.restaurant,
    lines: (q.lines ?? []).map((l: any) => ({
      menuItemId: l.menu_item_id,
      name: l.name,
      unitPrice: Number(l.unit_price),
      quantity: l.quantity,
      lineTotal: Number(l.line_total),
      isVeg: l.is_veg,
    })),
    subtotal: Number(q.subtotal),
    discount: Number(q.discount),
    deliveryFee: Number(q.delivery_fee),
    tax: Number(q.tax),
    total: Number(q.total),
    couponCode: q.coupon_code,
    minOrder: Number(q.min_order),
    unavailableIds: q.unavailable_ids ?? [],
    issues: q.issues ?? [],
  };
}

// ---------- Price quote (the server decides every price) ----------
export async function quoteOrder(
  input: unknown,
  coupon?: string
): Promise<{ quote?: Quote; error?: string }> {
  const cart = parseCart(input);
  if (!cart) return { error: "Your cart looks invalid. Please refresh the page." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("quote_order", {
    p_restaurant_id: cart.restaurantId,
    p_items: toRpcItems(cart),
    p_coupon: cleanCoupon(coupon),
  });
  if (error || !data) return { error: "Could not load prices. Please try again." };
  return { quote: mapQuote(data) };
}

// ---------- Place the order ----------
export async function placeOrder(
  input: unknown,
  addressId: string,
  coupon: string,
  notes: string
): Promise<{ orderId?: string; error?: string }> {
  const cart = parseCart(input);
  if (!cart) return { error: "Your cart looks invalid. Please refresh the page." };
  if (typeof addressId !== "string" || !UUID.test(addressId)) {
    return { error: "Please choose a delivery address." };
  }
  const note = typeof notes === "string" ? notes.trim().slice(0, 300) : "";

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please log in to place your order." };

  const { data, error } = await supabase.rpc("place_order", {
    p_restaurant_id: cart.restaurantId,
    p_items: toRpcItems(cart),
    p_address_id: addressId,
    p_coupon: cleanCoupon(coupon),
    p_notes: note || null,
  });
  if (error || !data) return { error: orderErrorMessage(error?.message ?? "") };

  return { orderId: (data as any).id as string };
}

// ---------- Save a delivery address ----------
export type AddressState = { error?: string; id?: string };

export async function addAddress(_prev: AddressState, formData: FormData): Promise<AddressState> {
  const get = (name: string) => String(formData.get(name) ?? "").trim();

  const label = get("label") || "Home";
  const recipientName = get("recipientName");
  const phone = get("phone");
  const line1 = get("line1");
  const line2 = get("line2");
  const city = get("city");
  const state = get("state");
  const pincode = get("pincode");

  if (!["Home", "Work", "Other"].includes(label)) return { error: "Please choose a valid label." };
  if (recipientName.length < 1 || recipientName.length > 100) return { error: "Please enter the receiver's name." };
  if (!/^[0-9+ ()-]{7,15}$/.test(phone)) return { error: "Please enter a valid phone number (7 to 15 digits)." };
  if (line1.length < 1 || line1.length > 200) return { error: "Please enter your house or street address." };
  if (line2.length > 200) return { error: "The second address line is too long." };
  if (city.length < 1 || city.length > 80) return { error: "Please enter your city." };
  if (state.length < 1 || state.length > 80) return { error: "Please enter your state." };
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return { error: "Please enter a valid 6-digit pincode." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please log in first." };

  const { count } = await supabase
    .from("user_addresses")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) >= 10) return { error: "You can save up to 10 addresses." };

  const { data, error } = await supabase
    .from("user_addresses")
    .insert({
      user_id: auth.user.id,
      label,
      recipient_name: recipientName,
      phone,
      line1,
      line2: line2 || null,
      city,
      state,
      pincode,
      is_default: (count ?? 0) === 0,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Could not save the address. Please try again." };
  return { id: data.id as string };
}
