import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AddressManager from "@/components/account/AddressManager";
import type { Address } from "@/lib/types";

export const metadata = { title: "Saved addresses | FoodieGo" };

/* eslint-disable @typescript-eslint/no-explicit-any */

async function AddressList() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/addresses");

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

  return <AddressManager addresses={addresses} />;
}

export default function AddressesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/account" className="text-sm font-medium text-orange-600 hover:underline">
        ← My account
      </Link>
      <h1 className="mb-6 mt-2 text-3xl font-extrabold text-stone-900">Saved addresses</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-100" />}>
        <AddressList />
      </Suspense>
    </div>
  );
}
