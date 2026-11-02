import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";

export const metadata = { title: "Sign up | FoodieGo" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold text-stone-900">Create your account</h1>
      <p className="mt-1 text-stone-600">It takes less than a minute.</p>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <SignupForm />
      </div>
      <p className="mt-4 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-orange-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
