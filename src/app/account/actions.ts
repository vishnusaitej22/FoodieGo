"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAddressForm } from "@/lib/address";
import { accountErrorMessage } from "@/lib/messages";
import type { AddressState } from "@/app/checkout/actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------- Profile ----------
export type ProfileState = { error?: string; saved?: boolean };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2 || fullName.length > 100)
    return { error: "Please enter your name (2 to 100 characters)." };
  if (phone !== "" && !/^[0-9+ ()-]{7,15}$/.test(phone))
    return { error: "Please enter a valid phone number (7 to 15 digits), or leave it empty." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please log in first." };

  // The database only lets you change YOUR OWN profile (full_name and phone only).
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone === "" ? null : phone })
    .eq("id", auth.user.id)
    .select("id");

  if (error || !data || data.length === 0)
    return { error: "Could not save your profile. Please try again." };

  revalidatePath("/", "layout");
  return { saved: true };
}

// ---------- Addresses ----------
export async function updateAddress(
  addressId: string,
  _prev: AddressState,
  formData: FormData
): Promise<AddressState> {
  if (typeof addressId !== "string" || !UUID.test(addressId)) return { error: "Invalid address." };
  const parsed = parseAddressForm(formData);
  if (!parsed.value) return { error: parsed.error };
  const a = parsed.value;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please log in first." };

  const { data, error } = await supabase
    .from("user_addresses")
    .update({
      label: a.label,
      recipient_name: a.recipientName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 || null,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    })
    .eq("id", addressId)
    .eq("user_id", auth.user.id)
    .select("id");

  if (error || !data || data.length === 0)
    return { error: "Could not save the address. Please try again." };
  return { id: addressId };
}

export async function makeDefaultAddress(addressId: string): Promise<{ error?: string }> {
  if (typeof addressId !== "string" || !UUID.test(addressId)) return { error: "Invalid address." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_default_address", { p_address_id: addressId });
  if (error) return { error: accountErrorMessage(error.message) };
  return {};
}

export async function removeAddress(addressId: string): Promise<{ error?: string }> {
  if (typeof addressId !== "string" || !UUID.test(addressId)) return { error: "Invalid address." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_address", { p_address_id: addressId });
  if (error) return { error: accountErrorMessage(error.message) };
  return {};
}
