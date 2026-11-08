
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAdminOrder } from "@/app/admin/orders/actions";
import { NEXT_STATUSES, STATUS_LABEL, STATUS_STYLE } from "@/lib/order-status";
import { formatINR } from "@/lib/format";

type AdminOrder = {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  restaurantName: string;
  status: string;
  paymentStatus: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryPincode: string;
  subtotal: number;
  totalAmount: number;
  createdAt: string;
};

const statuses = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

const paymentLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export default function AdminOrdersClient({
  orders,
}: {
  orders: AdminOrder[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = [
        order.orderNumber,
        order.restaurantName,
        order.customerName,
        order.deliveryPhone,
      ].some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      );

      const matchesStatus =
        filter === "all" || order.status === filter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, filter]);

  function updateOrder(
    orderId: string,
    field: "status" | "payment_status",
    value: string
  ) {
    setMessage("");

    startTransition(async () => {
      const result = await updateAdminOrder(orderId, field, value);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setMessage(
  result.success
    ? "Updated successfully."
    : result.error || "Update failed."
);
      router.refresh();
    });
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Total Orders</p>
          <p className="mt-2 text-3xl font-bold">{orders.length}</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Pending Orders</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {orders.filter((o) => o.status === "pending").length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Delivered Orders</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {orders.filter((o) => o.status === "delivered").length}
          </p>
        </div>
      </div>

      {/* Search and filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search order, restaurant, customer or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-orange-500"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-stone-300 bg-white px-4 py-3"
        >
          <option value="all">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-800"
        >
          {message}
        </p>
      )}

      {isPending && (
        <p className="mb-4 text-sm text-stone-500">
          Updating order...
        </p>
      )}

      {/* Orders */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center text-stone-500">
            No orders found.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-lg font-bold">
                    {order.orderNumber}
                  </h2>

                  <p className="mt-1 text-sm text-stone-600">
                    {order.restaurantName}
                  </p>

                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-stone-500">Customer</p>
                  <p className="font-semibold">{order.customerName}</p>
                </div>

                <div>
                  <p className="text-xs text-stone-500">Order Amount</p>
                  <p className="text-lg font-bold">
                    {formatINR(order.totalAmount)}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    STATUS_STYLE[order.status] || "bg-stone-100 text-stone-700"
                  }`}
                >
                  {STATUS_LABEL[order.status] || order.status}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setExpanded(
                      expanded === order.id ? null : order.id
                    )
                  }
                  className="rounded-lg bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
                >
                  {expanded === order.id ? "Close details" : "View details"}
                </button>
              </div>

              {expanded === order.id && (
                <div className="border-t border-stone-200 bg-stone-50 p-5">
                  <div className="grid gap-6 md:grid-cols-2">

                    {/* Delivery information */}
                    <section>
                      <h3 className="mb-3 font-bold text-stone-900">
                        Customer & Delivery
                      </h3>

                      <p className="text-sm text-stone-700">
                        <strong>Name:</strong> {order.deliveryName}
                      </p>

                      <p className="mt-2 text-sm text-stone-700">
                        <strong>Phone:</strong> {order.deliveryPhone}
                      </p>

                      <p className="mt-2 text-sm text-stone-700">
                        <strong>Address:</strong> {order.deliveryAddress}
                      </p>

                      <p className="mt-2 text-sm text-stone-700">
                        <strong>Pincode:</strong> {order.deliveryPincode}
                      </p>

                      <p className="mt-2 text-sm text-stone-700">
                        <strong>Item subtotal:</strong>{" "}
                        {formatINR(order.subtotal)}
                      </p>

                      <p className="mt-2 text-sm text-stone-700">
                        <strong>Total:</strong>{" "}
                        {formatINR(order.totalAmount)}
                      </p>
                    </section>

                    {/* Admin controls */}
                    <section>
                      <h3 className="mb-3 font-bold text-stone-900">
                        Manage Order
                      </h3>

                      <label className="mb-2 block text-sm font-medium">
                        Order Status
                      </label>

                      <select
                        value={order.status}
                        disabled={
                          isPending ||
                          (NEXT_STATUSES[order.status] ?? []).length === 0
                        }
                        onChange={(e) =>
                          updateOrder(
                            order.id,
                            "status",
                            e.target.value
                          )
                        }
                        className="mb-1 w-full rounded-lg border border-stone-300 bg-white p-3 disabled:bg-stone-100"
                      >
                        {[order.status, ...(NEXT_STATUSES[order.status] ?? [])].map(
                          (status) => (
                            <option key={status} value={status}>
                              {STATUS_LABEL[status] ?? status}
                            </option>
                          )
                        )}
                      </select>
                      <p className="mb-5 text-xs text-stone-500">
                        {(NEXT_STATUSES[order.status] ?? []).length === 0
                          ? "This order is final. Its status cannot change."
                          : "Orders move forward one step at a time. They can be cancelled until delivered."}
                      </p>

                      <label className="mb-2 block text-sm font-medium">
                        Payment Status
                      </label>

                      <select
                        value={order.paymentStatus}
                        disabled={isPending}
                        onChange={(e) =>
                          updateOrder(
                            order.id,
                            "payment_status",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-stone-300 bg-white p-3"
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {paymentLabels[status]}
                          </option>
                        ))}
                      </select>
                    </section>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <p className="mt-5 text-sm text-stone-500">
        Showing {filteredOrders.length} of {orders.length} orders.
      </p>
    </div>
  );
}
