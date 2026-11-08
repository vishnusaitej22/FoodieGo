import { Check } from "lucide-react";

const STEPS = [
  { key: "pending", label: "Order placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

// Shows how far the order has got. The status is changed by FoodieGo staff in
// the admin dashboard. This is NOT live GPS tracking.
export default function OrderTracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div role="status" className="mt-5 rounded-xl bg-stone-100 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">This order was cancelled.</p>
        <p>No payment is due.</p>
      </div>
    );
  }

  const current = Math.max(0, STEPS.findIndex((s) => s.key === status));

  return (
    <div className="mt-5">
      <ol className="flex items-start" aria-label="Order progress">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={step.key}
              className="relative flex flex-1 flex-col items-center text-center"
              aria-current={active ? "step" : undefined}
            >
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                    i <= current ? "bg-green-500" : "bg-stone-200"
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-green-500 text-white"
                    : active
                      ? "bg-orange-500 text-white ring-4 ring-orange-100"
                      : "bg-stone-200 text-stone-500"
                }`}
              >
                {done ? <Check size={16} aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={`mt-2 text-xs ${active ? "font-bold text-stone-900" : "text-stone-500"}`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-xs text-stone-400">
        Status is updated by FoodieGo. Live map tracking is not available.
      </p>
    </div>
  );
}
