import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/order-status";
import OrderTracker from "@/components/orders/OrderTracker";
import CancelOrderButton from "@/components/orders/CancelOrderButton";

export const metadata = { title: "Order details | FoodieGo" };

/* eslint-disable @typescript-eslint/no-explicit-any */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Pending (pay on delivery)",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ placed?: string }>;

async function OrderDetails({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const { placed } = await searchParams;
  if (!UUID.test(id)) notFound();

  // Row Level Security means you can only ever load YOUR OWN orders here.
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("item_name, unit_price, quantity, line_total")
    .eq("order_id", id)
    .order("item_name");

  const o = order as any;
  const placedAt = new Date(o.created_at).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  return (
    <>
      {placed === "1" && (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl bg-green-50 p-5 text-green-800">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <p className="font-bold">Order placed successfully!</p>
            <p className="text-sm">
              Your order number is <strong>{o.order_number}</strong>. Pay in cash when it arrives.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">Order {o.order_number}</h1>
            <p className="text-sm text-stone-500">{o.restaurant_name} · {placedAt}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[o.status] ?? "bg-stone-100 text-stone-700"}`}>
            {STATUS_LABEL[o.status] ?? o.status}
          </span>
        </div>

        <OrderTracker status={o.status} />

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Payment method</dt>
            <dd className="font-medium">Cash on Delivery</dd>
          </div>
          <div>
            <dt className="text-stone-500">Payment status</dt>
            <dd className="font-medium">
              {o.status === "cancelled" && o.payment_status === "pending"
                ? "Not applicable (order cancelled)"
                : (PAYMENT_LABEL[o.payment_status] ?? o.payment_status)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Delivering to</dt>
            <dd className="font-medium">
              {o.delivery_name}, {o.delivery_address} {o.delivery_pincode}
              <br />
              Phone: {o.delivery_phone}
            </dd>
          </div>
          {o.notes && (
            <div className="sm:col-span-2">
              <dt className="text-stone-500">Your note</dt>
              <dd className="font-medium">{o.notes}</dd>
            </div>
          )}
        </dl>

        <ul className="mt-5 divide-y divide-stone-200 border-y border-stone-200 text-sm">
          {(items ?? []).map((i: any, idx: number) => (
            <li key={idx} className="flex justify-between gap-3 py-2">
              <span>{i.item_name} × {i.quantity}</span>
              <span>{formatINR(Number(i.line_total))}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-stone-600">Item total</dt><dd>{formatINR(Number(o.subtotal))}</dd></div>
          {Number(o.discount_amount) > 0 && (
            <div className="flex justify-between text-green-700"><dt>Coupon {o.coupon_code}</dt><dd>-{formatINR(Number(o.discount_amount))}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-stone-600">Delivery fee</dt><dd>{Number(o.delivery_fee) === 0 ? "Free" : formatINR(Number(o.delivery_fee))}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-600">Taxes</dt><dd>{formatINR(Number(o.tax_amount))}</dd></div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold"><dt>Total</dt><dd>{formatINR(Number(o.total_amount))}</dd></div>
        </dl>
      </div>

      {o.status === "pending" && <CancelOrderButton orderId={o.id} />}

      <p className="mt-6 text-center">
        <Link href="/orders" className="font-semibold text-orange-600 hover:underline">
          All my orders
        </Link>
        <span className="mx-3 text-stone-300" aria-hidden="true">|</span>
        <Link href="/restaurants" className="font-semibold text-orange-600 hover:underline">
          Order something else
        </Link>
      </p>
    </>
  );
}

export default function OrderPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-stone-100" />}>
        <OrderDetails params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
