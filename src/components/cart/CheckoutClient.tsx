"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearCart, useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { issueMessage } from "@/lib/messages";
import type { Address } from "@/lib/types";
import { placeOrder } from "@/app/checkout/actions";
import { useQuote } from "./useQuote";
import OrderSummary from "./OrderSummary";
import AddressForm from "./AddressForm";

export default function CheckoutClient({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const cart = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [selected, setSelected] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ""
  );
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  const { quote, error, loading } = useQuote(cart, coupon);

  if (cart.items.length === 0 && !placing) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
        <h2 className="text-xl font-bold text-stone-900">Your cart is empty</h2>
        <Link href="/restaurants" className="mt-4 inline-block font-semibold text-orange-600 hover:underline">
          Browse restaurants
        </Link>
      </div>
    );
  }

  const addressId = addresses.some((a) => a.id === selected) ? selected : addresses[0]?.id ?? "";
  const issues = quote?.issues ?? [];
  const couponIssue = issues.includes("invalid_coupon");
  const blocking = issues.filter((i) => i !== "invalid_coupon");
  const canPlace = !!quote && !loading && !placing && issues.length === 0 && !!addressId;

  async function handlePlace() {
    if (!canPlace || !cart.restaurantId) return;
    setPlacing(true);
    setPlaceError("");
    try {
      const result = await placeOrder(
        {
          restaurantId: cart.restaurantId,
          items: cart.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        },
        addressId,
        coupon,
        notes
      );
      if (result.error || !result.orderId) {
        setPlaceError(result.error ?? "We could not place your order. Please try again.");
        setPlacing(false);
        return;
      }
      clearCart();
      router.push(`/orders/${result.orderId}?placed=1`);
    } catch {
      setPlaceError("Could not reach the server. Please check your connection and try again.");
      setPlacing(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* 1. Address */}
        <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
          <h2 className="text-lg font-bold text-stone-900">1. Delivery address</h2>
          {addresses.length > 0 && (
            <fieldset className="mt-3 space-y-2">
              <legend className="sr-only">Choose a delivery address</legend>
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${
                    addressId === a.id ? "border-orange-500 bg-orange-50" : "border-stone-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={a.id}
                    checked={addressId === a.id}
                    onChange={() => setSelected(a.id)}
                    className="mt-1 accent-orange-500"
                  />
                  <span className="text-sm text-stone-700">
                    <span className="font-semibold text-stone-900">
                      {a.label} · {a.recipientName}
                    </span>
                    <br />
                    {[a.line1, a.line2, a.city, a.state].filter(Boolean).join(", ")} {a.pincode}
                    <br />
                    Phone: {a.phone}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {showForm ? (
            <AddressForm
              onAdded={(id) => {
                setSelected(id);
                setShowForm(false);
                router.refresh();
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-semibold text-orange-600 hover:underline"
            >
              + Add a new address
            </button>
          )}
        </section>

        {/* 2. Notes */}
        <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
          <h2 className="text-lg font-bold text-stone-900">2. Delivery note (optional)</h2>
          <label className="sr-only" htmlFor="notes">Delivery note</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="For example: ring the bell twice"
            className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </section>

        {/* 3. Payment */}
        <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
          <h2 className="text-lg font-bold text-stone-900">3. Payment</h2>
          <p className="mt-3 rounded-xl border border-orange-500 bg-orange-50 p-3 text-sm">
            <span className="font-semibold">Cash on Delivery</span>
            <br />
            Pay in cash when your order arrives. Online payments are not available yet.
          </p>
        </section>
      </div>

      {/* Summary */}
      <aside className="space-y-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
          <h2 className="text-lg font-bold text-stone-900">{cart.restaurantName}</h2>
          <ul className="mt-3 space-y-1 text-sm text-stone-700">
            {(quote?.lines ?? []).map((l) => (
              <li key={l.menuItemId} className="flex justify-between gap-2">
                <span>{l.name} × {l.quantity}</span>
                <span>{formatINR(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
          <label htmlFor="coupon" className="text-sm font-semibold text-stone-900">Coupon code</label>
          <div className="mt-2 flex gap-2">
            <input
              id="coupon"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              maxLength={20}
              placeholder="e.g. WELCOME50"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm uppercase outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={() => setCoupon(couponInput.trim())}
              className="rounded-lg bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-700"
            >
              Apply
            </button>
          </div>
          {coupon && (
            <button
              type="button"
              onClick={() => { setCoupon(""); setCouponInput(""); }}
              className="mt-2 text-xs text-stone-500 underline"
            >
              Remove coupon
            </button>
          )}
          {couponIssue && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {issueMessage("invalid_coupon")}
            </p>
          )}
          <p className="mt-2 text-xs text-stone-500">Demo coupons: WELCOME50, FOODIE20</p>
        </div>

        <OrderSummary quote={quote} loading={loading} />

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {blocking.map((code) => (
          <p key={code} role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {code === "below_min_order" && quote
              ? `Minimum order is ${formatINR(quote.minOrder)}. Please add more items.`
              : issueMessage(code)}
          </p>
        ))}
        {!addressId && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Please add a delivery address.
          </p>
        )}
        {placeError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{placeError}</p>
        )}

        <button
          type="button"
          onClick={handlePlace}
          disabled={!canPlace}
          className="w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {placing ? "Placing order..." : `Place order${quote ? ` · ${formatINR(quote.total)}` : ""}`}
        </button>
        <p className="text-center text-xs text-stone-500">
          <Link href="/cart" className="underline">Back to cart</Link>
        </p>
      </aside>
    </div>
  );
}
