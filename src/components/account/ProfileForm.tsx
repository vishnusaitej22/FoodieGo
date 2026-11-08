"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/account/actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

export default function ProfileForm({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfile, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.saved && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Profile saved.</p>
      )}
      <label className="block text-sm text-stone-700">
        Full name
        <input name="fullName" required maxLength={100} defaultValue={fullName} autoComplete="name" className={inputClass} />
      </label>
      <label className="block text-sm text-stone-700">
        Phone number (optional)
        <input name="phone" type="tel" maxLength={15} defaultValue={phone} autoComplete="tel" className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
