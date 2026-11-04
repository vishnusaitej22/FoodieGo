import type { Quote } from "@/lib/types";
import { formatINR } from "@/lib/format";

export default function OrderSummary({ quote, loading }: { quote?: Quote; loading: boolean }) {
  if (!quote) {
    return <div className="h-40 animate-pulse rounded-2xl bg-stone-100" aria-busy="true" />;
  }

  return (
    <dl
      className={`space-y-2 rounded-2xl bg-white p-5 text-sm ring-1 ring-stone-200 ${loading ? "opacity-60" : ""}`}
      aria-busy={loading}
    >
      <div className="flex justify-between">
        <dt className="text-stone-600">Item total</dt>
        <dd className="font-medium">{formatINR(quote.subtotal)}</dd>
      </div>
      {quote.discount > 0 && (
        <div className="flex justify-between text-green-700">
          <dt>Coupon {quote.couponCode}</dt>
          <dd className="font-medium">-{formatINR(quote.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-stone-600">Delivery fee</dt>
        <dd className="font-medium">{quote.deliveryFee === 0 ? "Free" : formatINR(quote.deliveryFee)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-stone-600">Taxes (5% GST, demo)</dt>
        <dd className="font-medium">{formatINR(quote.tax)}</dd>
      </div>
      <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold text-stone-900">
        <dt>To pay</dt>
        <dd>{formatINR(quote.total)}</dd>
      </div>
    </dl>
  );
}
