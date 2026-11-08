"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder } from "@/app/orders/actions";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setError("");
    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="mt-5">
      {error && (
        <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Cancelling..." : "Cancel order"}
      </button>
      <p className="mt-1 text-xs text-stone-500">You can cancel while the order is still pending.</p>
    </div>
  );
}
