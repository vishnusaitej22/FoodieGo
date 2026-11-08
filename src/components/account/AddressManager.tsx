"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@/lib/types";
import AddressForm from "@/components/cart/AddressForm";
import { makeDefaultAddress, removeAddress } from "@/app/account/actions";

export default function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(addresses.length === 0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ error?: string }>) {
    setError("");
    startTransition(async () => {
      const result = await task();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function done() {
    setEditingId(null);
    setAdding(false);
    router.refresh();
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
            {editingId === a.id ? (
              <AddressForm initial={a} onAdded={done} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm text-stone-700">
                  <p className="font-semibold text-stone-900">
                    {a.label} · {a.recipientName}
                    {a.isDefault && (
                      <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="mt-1">
                    {[a.line1, a.line2, a.city, a.state].filter(Boolean).join(", ")} {a.pincode}
                  </p>
                  <p>Phone: {a.phone}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm font-semibold">
                  {!a.isDefault && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => makeDefaultAddress(a.id))}
                      className="text-orange-600 hover:underline disabled:opacity-50"
                    >
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setAdding(false); setEditingId(a.id); }}
                    className="text-stone-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm("Delete this address?")) run(() => removeAddress(a.id));
                    }}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {addresses.length === 0 && !adding && (
        <p className="rounded-2xl bg-stone-50 p-8 text-center text-stone-500">No saved addresses yet.</p>
      )}

      {adding ? (
        <div className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
          <h2 className="font-bold text-stone-900">New address</h2>
          <AddressForm onAdded={done} onCancel={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setEditingId(null); setAdding(true); }}
          className="mt-4 rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600"
        >
          + Add a new address
        </button>
      )}
    </div>
  );
}
