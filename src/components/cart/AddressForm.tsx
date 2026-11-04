"use client";

import { useActionState } from "react";
import { addAddress, type AddressState } from "@/app/checkout/actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

export default function AddressForm({
  onAdded,
  onCancel,
}: {
  onAdded: (id: string) => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState<AddressState, FormData>(
    async (prev, formData) => {
      const result = await addAddress(prev, formData);
      if (result.id) onAdded(result.id);
      return result;
    },
    {}
  );

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-xl bg-stone-50 p-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-stone-700">
          Receiver&apos;s name
          <input name="recipientName" required maxLength={100} autoComplete="name" className={inputClass} />
        </label>
        <label className="text-sm text-stone-700">
          Phone number
          <input name="phone" required type="tel" maxLength={15} autoComplete="tel" className={inputClass} />
        </label>
      </div>
      <label className="block text-sm text-stone-700">
        House / street address
        <input name="line1" required maxLength={200} autoComplete="address-line1" className={inputClass} />
      </label>
      <label className="block text-sm text-stone-700">
        Area / landmark (optional)
        <input name="line2" maxLength={200} autoComplete="address-line2" className={inputClass} />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-stone-700">
          City
          <input name="city" required maxLength={80} autoComplete="address-level2" className={inputClass} />
        </label>
        <label className="text-sm text-stone-700">
          State
          <input name="state" required maxLength={80} autoComplete="address-level1" className={inputClass} />
        </label>
        <label className="text-sm text-stone-700">
          Pincode
          <input
            name="pincode"
            required
            inputMode="numeric"
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            autoComplete="postal-code"
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm text-stone-700">
        Save as
        <select name="label" defaultValue="Home" className={inputClass}>
          <option>Home</option>
          <option>Work</option>
          <option>Other</option>
        </select>
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-5 py-2 font-medium text-stone-600 hover:bg-stone-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
