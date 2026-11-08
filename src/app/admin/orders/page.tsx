
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";

export const instant = false;

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-xl bg-white p-6">
          <h1 className="text-2xl font-bold text-red-600">
            Could not load orders
          </h1>
          <p className="mt-2 text-stone-600">{error.message}</p>
        </div>
      </main>
    );
  }

  const orderRows = orders ?? [];

  const userIds = [
    ...new Set(
      orderRows
        .map((order) => order.user_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const restaurantIds = [
    ...new Set(
      orderRows
        .map((order) => order.restaurant_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const [profilesResult, restaurantsResult] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),

    restaurantIds.length
      ? supabase
          .from("restaurants")
          .select("id, name")
          .in("id", restaurantIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const profiles = profilesResult.data ?? [];
  const restaurants = restaurantsResult.data ?? [];

  const adminOrders = orderRows.map((order) => {
    const profile = profiles.find((item) => item.id === order.user_id);
    const restaurant = restaurants.find(
      (item) => item.id === order.restaurant_id
    );

    return {
      id: order.id,
      orderNumber: order.order_number ?? order.id,
      userId: order.user_id ?? null,
      customerName: profile?.full_name || "Customer",
      restaurantName: restaurant?.name || "Restaurant",
      status: order.status,
      paymentStatus: order.payment_status,
      deliveryName: order.delivery_name ?? "",
      deliveryPhone: order.delivery_phone ?? "",
      deliveryAddress: order.delivery_address ?? "",
      deliveryPincode: order.delivery_pincode ?? "",
      subtotal: Number(order.subtotal ?? 0),
      totalAmount: Number(order.total_amount ?? 0),
      createdAt: order.created_at,
    };
  });

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            FoodieGo Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold text-stone-900">
            Manage Orders
          </h1>

          <p className="mt-2 text-stone-600">
            Search orders, view customer details, and update order and payment
            statuses.
          </p>
        </div>

        <AdminOrdersClient orders={adminOrders} />
      </div>
    </main>
  );
}
