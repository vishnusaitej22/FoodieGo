// Friendly text for the problem codes returned by the database.
const ISSUE_TEXT: Record<string, string> = {
  empty_cart: "Your cart is empty.",
  too_many_items: "Your cart has too many items. Please remove a few.",
  bad_quantity: "Each item can be ordered 1 to 20 times.",
  bad_request: "Something is wrong with your cart. Please refresh and try again.",
  restaurant_unavailable: "This restaurant is not available right now.",
  item_unavailable: "Some items are no longer available. Please remove them.",
  below_min_order: "Your order is below the restaurant's minimum order amount.",
  invalid_coupon: "That coupon is not valid for this order.",
  login_required: "Please log in to use a coupon.",
};

export function issueMessage(code: string): string {
  return ISSUE_TEXT[code] ?? "Something went wrong. Please try again.";
}

// Turns a database error (from place_order) into a friendly sentence.
export function orderErrorMessage(raw: string): string {
  if (raw.includes("RATE_LIMITED"))
    return "You have placed several orders very quickly. Please wait a few minutes and try again.";
  if (raw.includes("INVALID_ADDRESS")) return "Please choose one of your saved delivery addresses.";
  if (raw.includes("NOTES_TOO_LONG")) return "Your delivery note is too long (300 characters maximum).";
  if (raw.includes("NOT_AUTHENTICATED")) return "Please log in to place your order.";
  const m = raw.match(/ORDER_INVALID:\s*([a-z_]+)/);
  if (m) return issueMessage(m[1]);
  return "We could not place your order. Please try again.";
}

// Turns an error from the cancel_order / address functions into friendly text.
export function accountErrorMessage(raw: string): string {
  if (raw.includes("CANNOT_CANCEL"))
    return "This order cannot be cancelled any more. It may already be cancelled, or the restaurant has started preparing it.";
  if (raw.includes("ORDER_NOT_FOUND")) return "We could not find that order.";
  if (raw.includes("INVALID_ADDRESS")) return "We could not find that address.";
  if (raw.includes("NOT_AUTHENTICATED")) return "Please log in first.";
  return "Something went wrong. Please try again.";
}
