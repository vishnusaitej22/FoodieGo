"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";

type EditableOrderField = "status" | "payment_status";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const allowedStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const allowedPaymentStatuses = ["pending", "paid", "failed", "refunded"] as const;

export async function updateAdminOrder(
  orderId: string,
  field: EditableOrderField,
  value: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof orderId !== "string" || !UUID.test(orderId)) {
    return { success: false, error: "Invalid order." };
  }

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "You must be logged in." };
  if (!(await isCurrentUserAdmin())) {
    return { success: false, error: "Admin access required." };
  }

  if (field !== "status" && field !== "payment_status") {
    return { success: false, error: "Invalid order update." };
  }
  if (
    typeof value !== "string" ||
    (field === "status" &&
      !allowedStatuses.includes(value as (typeof allowedStatuses)[number])) ||
    (field === "payment_status" &&
      !allowedPaymentStatuses.includes(value as (typeof allowedPaymentStatuses)[number]))
  ) {
    return {
      success: false,
      error: field === "status" ? "Invalid order status." : "Invalid payment status.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update(field === "status" ? { status: value } : { payment_status: value })
    .eq("id", orderId)
    .select("id");

  if (error) {
    console.error("Admin order update failed:", error.message);
    if (error.message.includes("INVALID_STATUS_CHANGE")) {
      return {
        success: false,
        error:
          "That status change is not allowed. Orders move forward one step at a time, and delivered or cancelled orders are final.",
      };
    }
    return { success: false, error: "Could not update the order. Please try again." };
  }
  if (!data || data.length === 0) {
    return { success: false, error: "Order not found." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);

  return { success: true };
}
