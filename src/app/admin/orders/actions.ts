
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";

type EditableOrderField = "status" | "payment_status";

type OrderValue = string | boolean;

const allowedStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const allowedPaymentStatuses = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export async function updateAdminOrder(
  orderId: string,
  field: EditableOrderField,
  value: OrderValue
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  if (!(await isCurrentUserAdmin())) {
    return { success: false, error: "Admin access required." };
  }

  if (!orderId || !["status", "payment_status"].includes(field)) {
    return { success: false, error: "Invalid order update." };
  }

  const supabase = await createClient();

  if (field === "status") {
    if (
      typeof value !== "string" ||
      !allowedStatuses.includes(value as (typeof allowedStatuses)[number])
    ) {
      return { success: false, error: "Invalid order status." };
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: value })
      .eq("id", orderId);

    if (error) return { success: false, error: error.message };
  } else {
    if (
      typeof value !== "string" ||
      !allowedPaymentStatuses.includes(
        value as (typeof allowedPaymentStatuses)[number]
      )
    ) {
      return { success: false, error: "Invalid payment status." };
    }

    const { error } = await supabase
      .from("orders")
      .update({ payment_status: value })
      .eq("id", orderId);

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");

  return { success: true };
}
