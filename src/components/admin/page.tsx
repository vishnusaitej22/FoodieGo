
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";

export const instant = false;

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (!(await isCurrentUserAdmin())) redirect("/");

  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      user_id,
      restaurant_name,
      status,
      payment_status,
      delivery_name,
      delivery_phone,
      delivery_address,
      delivery_pincode,
      subtotal,
      total_amount,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin orders fetch failed:", error.message);
  }

  const userIds = [
    ...new Set(
      (orders ?? [])
        .map((order) => order.user_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  let profiles: { id: string; full_name: string | null }[] = [];

  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    profiles = data ?? [];
  }

  const customerNames = Object.fromEntries(
    profiles.map((profile) => [
      profile.id,
      profile.full_name || "Customer",
    ])
  );

  const formattedOrders = (orders ?? []).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    userId: order.user_id,
    customerName: order.user_id
      ? customerNames[order.user_id] || "Customer"
      : "Guest",
    restaurantName: order.restaurant_name,
    status: order.status,
    paymentStatus: order.payment_status,
    deliveryName: order.delivery_name,
    deliveryPhone: order.delivery_phone,
    deliveryAddress: order.delivery_address,
    deliveryPincode: order.delivery_pincode,
    subtotal: Number(order.subtotal),
    totalAmount: Number(order.total_amount),
    createdAt: order.created_at,
  }));

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <Link
          href="/admin"
          className="mb-5 inline-block font-semibold text-orange-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-8">
          <p className="text-sm font-bold tracking-wide text-orange-600">
            FOODIEGO ADMINISTRATION
          </p>

          <h1 className="mt-2 text-3xl font-bold text-stone-900">
            Order Management
          </h1>

          <p className="mt-2 text-stone-600">
            Welcome, {user.fullName || user.email}
          </p>
        </div>

        {error ? (
          <div className="rounded-xl bg-red-50 p-5 text-red-700">
            Could not load orders. Please check your database permissions.
          </div>
        ) : (
          <AdminOrdersClient orders={formattedOrders} />
        )}

      </div>
    </main>
  );
}
