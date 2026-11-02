"use client";

import { useActionState } from "react";
import { signup, type FormState } from "@/app/auth/actions";
import { Field, FormMessage } from "./AuthFields";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(signup, {});

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} message={state.message} />
      <Field id="fullName" label="Full name" autoComplete="name" />
      <Field id="email" label="Email" type="email" autoComplete="email" />
      <Field id="password" label="Password (8+ characters, letters and numbers)" type="password" autoComplete="new-password" />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-orange-500 px-4 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
