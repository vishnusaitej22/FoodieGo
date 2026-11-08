import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/account/ProfileForm";

export const metadata = { title: "My account | FoodieGo" };

async function AccountDetails() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const admin = await isCurrentUserAdmin();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <dl className="mt-6 divide-y divide-stone-200 rounded-2xl bg-white ring-1 ring-stone-200">
        <div className="flex justify-between px-5 py-4">
          <dt className="text-stone-500">Email</dt>
          <dd className="font-medium text-stone-900">{user.email}</dd>
        </div>
        <div className="flex justify-between px-5 py-4">
          <dt className="text-stone-500">Role</dt>
          <dd className="font-medium text-stone-900">{admin ? "Admin" : "Customer"}</dd>
        </div>
      </dl>

      <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="text-lg font-bold text-stone-900">Your details</h2>
        <div className="mt-4">
          <ProfileForm fullName={user.fullName} phone={profile?.phone ?? ""} />
        </div>
      </section>
    </>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-stone-900">My account</h1>
      <p className="mt-2 flex gap-5">
        <Link href="/orders" className="font-semibold text-orange-600 hover:underline">
          My orders
        </Link>
        <Link href="/account/addresses" className="font-semibold text-orange-600 hover:underline">
          Saved addresses
        </Link>
      </p>
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl bg-stone-100" />}>
        <AccountDetails />
      </Suspense>
    </div>
  );
}
