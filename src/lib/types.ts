export type Category = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  cuisines: string[];
  rating: number;
  deliveryMinutes: number;
  minOrder: number;
  deliveryFee: number;
  isVeg: boolean;
  offerText: string | null;
  createdAt: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  categoryName: string;
};

// ---------- Checkout ----------
export type QuoteLine = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  isVeg: boolean;
};

export type Quote = {
  restaurant: { id: string; name: string; slug: string } | null;
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  couponCode: string | null;
  minOrder: number;
  unavailableIds: string[];
  issues: string[];
};

export type Address = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};
