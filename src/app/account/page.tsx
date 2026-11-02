import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";

export const metadata = { title: "My account | FoodieGo" };

async function AccountDetails() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const admin = await isCurrentUserAdmin();

  return (
    <dl className="mt-6 divide-y divide-stone-200 rounded-2xl bg-white ring-1 ring-stone-200">
      <div className="flex justify-between px-5 py-4">
        <dt className="text-stone-500">Name</dt>
        <dd className="font-medium text-stone-900">{user.fullName || "Not set"}</dd>
      </div>
      <div className="flex justify-between px-5 py-4">
        <dt className="text-stone-500">Email</dt>
        <dd className="font-medium text-stone-900">{user.email}</dd>
      </div>
      <div className="flex justify-between px-5 py-4">
        <dt className="text-stone-500">Role</dt>
        <dd className="font-medium text-stone-900">{admin ? "Admin" : "Customer"}</dd>
      </div>
    </dl>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-stone-900">My account</h1>
      <Suspense fallback={<div className="mt-6 h-40 animate-pulse rounded-2xl bg-stone-100" />}>
        <AccountDetails />
      </Suspense>
    </div>
  );
}
