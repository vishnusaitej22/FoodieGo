import { Suspense } from "react";
import { redirect } from "next/navigation";
import CheckoutClient from "@/components/cart/CheckoutClient";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/types";

export const metadata = { title: "Checkout | FoodieGo" };

/* eslint-disable @typescript-eslint/no-explicit-any */

async function CheckoutContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_addresses")
    .select("id, label, recipient_name, phone, line1, line2, city, state, pincode, is_default")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load your addresses: " + error.message);

  const addresses: Address[] = (data ?? []).map((a: any) => ({
    id: a.id,
    label: a.label,
    recipientName: a.recipient_name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    isDefault: a.is_default,
  }));

  return <CheckoutClient addresses={addresses} />;
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold text-stone-900">Checkout</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-stone-100" />}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
