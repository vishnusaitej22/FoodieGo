import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/validation";

export const metadata = { title: "Log in | FoodieGo" };

type SearchParams = Promise<{ next?: string; error?: string }>;

async function LoginContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const notice =
    params.error === "confirm"
      ? "That confirmation link did not work or has expired. Please try logging in or sign up again."
      : undefined;

  return (
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <LoginForm next={next} notice={notice} />
    </div>
  );
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold text-stone-900">Welcome back</h1>
      <p className="mt-1 text-stone-600">Log in to order your favourite food.</p>
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl bg-stone-100" />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
      <p className="mt-4 text-center text-sm text-stone-600">
        New to FoodieGo?{" "}
        <Link href="/signup" className="font-semibold text-orange-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
