import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/order-status";

export const metadata = { title: "My orders | FoodieGo" };

/* eslint-disable @typescript-eslint/no-explicit-any */

async function OrderList() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");

  const supabase = await createClient();
  // .eq("user_id", ...) makes sure even an admin sees only their OWN orders here.
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, restaurant_name, status, total_amount, created_at, order_items(item_name, quantity)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Could not load your orders: " + error.message);

  const orders = (data ?? []) as any[];

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
        <p className="text-5xl" aria-hidden="true">🧾</p>
        <h2 className="mt-3 text-xl font-bold text-stone-900">No orders yet</h2>
        <p className="mt-1 text-stone-500">When you place an order, it will show up here.</p>
        <Link
          href="/restaurants"
          className="mt-5 inline-block rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => {
        const placedAt = new Date(o.created_at).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Kolkata",
        });
        const summary = (o.order_items ?? [])
          .map((i: any) => `${i.item_name} × ${i.quantity}`)
          .join(", ");

        return (
          <li key={o.id}>
            <Link
              href={`/orders/${o.id}`}
              className="block rounded-2xl bg-white p-5 ring-1 ring-stone-200 transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-stone-900">{o.restaurant_name}</p>
                  <p className="text-sm text-stone-500">
                    {o.order_number} · {placedAt}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[o.status] ?? "bg-stone-100 text-stone-700"}`}
                >
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>
              {summary && <p className="mt-3 line-clamp-2 text-sm text-stone-600">{summary}</p>}
              <p className="mt-3 font-semibold text-stone-900">{formatINR(Number(o.total_amount))}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold text-stone-900">My orders</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-100" />}>
        <OrderList />
      </Suspense>
    </div>
  );
}
