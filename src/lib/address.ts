// Shared checking for address forms (used when adding and when editing).
export type AddressInput = {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

export function parseAddressForm(formData: FormData): { value?: AddressInput; error?: string } {
  const get = (name: string) => String(formData.get(name) ?? "").trim();

  const value: AddressInput = {
    label: get("label") || "Home",
    recipientName: get("recipientName"),
    phone: get("phone"),
    line1: get("line1"),
    line2: get("line2"),
    city: get("city"),
    state: get("state"),
    pincode: get("pincode"),
  };

  if (!["Home", "Work", "Other"].includes(value.label)) return { error: "Please choose a valid label." };
  if (value.recipientName.length < 1 || value.recipientName.length > 100)
    return { error: "Please enter the receiver's name." };
  if (!/^[0-9+ ()-]{7,15}$/.test(value.phone))
    return { error: "Please enter a valid phone number (7 to 15 digits)." };
  if (value.line1.length < 1 || value.line1.length > 200)
    return { error: "Please enter your house or street address." };
  if (value.line2.length > 200) return { error: "The second address line is too long." };
  if (value.city.length < 1 || value.city.length > 80) return { error: "Please enter your city." };
  if (value.state.length < 1 || value.state.length > 80) return { error: "Please enter your state." };
  if (!/^[1-9][0-9]{5}$/.test(value.pincode)) return { error: "Please enter a valid 6-digit pincode." };

  return { value };
}
