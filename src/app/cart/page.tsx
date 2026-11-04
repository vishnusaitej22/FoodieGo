import CartView from "@/components/cart/CartView";

export const metadata = { title: "Your cart | FoodieGo" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold text-stone-900">Your cart</h1>
      <CartView />
    </div>
  );
}
