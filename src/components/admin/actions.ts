
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export async function updateAdminOrder(
  orderId: string,
  field: "status" | "payment_status",
  value: string
): Promise<{ error?: string; success?: string }> {
  if (!UUID.test(orderId)) {
    return { error: "Invalid order ID." };
  }

  const user = await getCurrentUser();

  if (!user || !(await isCurrentUserAdmin())) {
    return { error: "You are not authorized to manage orders." };
  }

  if (field === "status" && !ORDER_STATUSES.includes(value as typeof ORDER_STATUSES[number])) {
    return { error: "Invalid order status." };
  }

  if (field === "payment_status" && !PAYMENT_STATUSES.includes(value as typeof PAYMENT_STATUSES[number])) {
    return { error: "Invalid payment status." };
  }

  const supabase = await createClient();

  const update =
    field === "status"
      ? { status: value }
      : { payment_status: value };

  const { error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", orderId);

  if (error) {
    console.error("Admin order update failed:", error.message);
    return { error: "Could not update the order. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);

  return { success: "Order updated successfully." };
}
