"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountErrorMessage } from "@/lib/messages";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Customers can cancel their own order only while it is still "pending".
export async function cancelOrder(orderId: string): Promise<{ error?: string }> {
  if (typeof orderId !== "string" || !UUID.test(orderId)) return { error: "Invalid order." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
  if (error) return { error: accountErrorMessage(error.message) };

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return {};
}
