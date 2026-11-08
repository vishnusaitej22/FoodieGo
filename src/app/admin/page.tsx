
import { redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const instant = false;

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const supabase = await createClient();

  // Fetch dashboard statistics
  const [
    ordersCount,
    customersCount,
    restaurantsCount,
    deliveredOrders,
    recentOrders,
  ] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("restaurants").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount").eq("status", "delivered"),
    supabase
      .from("orders")
      .select("id, order_number, restaurant_name, status, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalOrders = ordersCount.count ?? 0;
  const totalCustomers = customersCount.count ?? 0;
  const totalRestaurants = restaurantsCount.count ?? 0;

  const revenue = (deliveredOrders.data ?? []).reduce(
    (total, order) => total + Number(order.total_amount),
    0
  );

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString("en-IN"),
      description: "All customer orders",
      icon: "🛒",
    },
    {
      title: "Total Customers",
      value: totalCustomers.toLocaleString("en-IN"),
      description: "Registered customer profiles",
      icon: "👥",
    },
    {
      title: "Restaurants",
      value: totalRestaurants.toLocaleString("en-IN"),
      description: "Restaurants in FoodieGo",
      icon: "🍽️",
    },
    {
      title: "Delivered Revenue",
      value: currency.format(revenue),
      description: "Revenue from delivered orders",
      icon: "💰",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-bold tracking-wide text-orange-600">
            FOODIEGO ADMINISTRATION
          </p>

          <h1 className="mt-2 text-3xl font-bold text-stone-900">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-stone-600">
            Welcome, {user.fullName || user.email}
          </p>

          {/* Admin management links */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/orders"
              className="inline-flex items-center rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700"
            >
              Manage All Orders →
            </Link>

            <Link
              href="/admin/restaurants"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Manage Restaurants →
            </Link>
          </div>
        </div>

        {/* Dashboard statistics */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-stone-500">
                  {stat.title}
                </p>
                <span className="text-2xl">{stat.icon}</span>
              </div>

              <h2 className="mt-4 break-words text-2xl font-bold text-stone-900">
                {stat.value}
              </h2>

              <p className="mt-2 text-xs text-stone-500">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <section className="mt-8 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Recent Orders
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Your five latest customer orders
              </p>
            </div>
          </div>

          {recentOrders.error ? (
            <p className="p-6 text-sm text-red-600">
              Could not load recent orders. Please check your database.
            </p>
          ) : !recentOrders.data?.length ? (
            <p className="p-6 text-stone-500">
              No orders have been placed yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Restaurant</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {recentOrders.data.map((order) => (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-stone-900">
                        {order.order_number}
                      </td>

                      <td className="px-6 py-4 text-stone-700">
                        {order.restaurant_name}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 font-medium">
                        {currency.format(Number(order.total_amount))}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold capitalize text-stone-700">
                          {order.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-stone-500">
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-stone-500">
          FoodieGo Admin Panel · Dashboard data from Supabase
        </p>
      </div>
    </div>
  );
}
