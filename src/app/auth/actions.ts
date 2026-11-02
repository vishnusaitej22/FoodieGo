"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, passwordProblem, safeNextPath } from "@/lib/validation";

export type FormState = { error?: string; message?: string };

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!isValidEmail(email)) return { error: "Please enter a valid email address." };
  if (!password) return { error: "Please enter your password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same message for wrong email or wrong password, on purpose.
     console.error("Signup error:", error.code, error.message);
    if (error.code === "weak_password") {
      return { error: "Please confirm your email first. Check your inbox." };
    }
    return { error: "Incorrect email or password." };
  }

  redirect(next);
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (fullName.length < 2 || fullName.length > 100) {
    return { error: "Please enter your name (2 to 100 characters)." };
  }
  if (!isValidEmail(email)) return { error: "Please enter a valid email address." };
  const problem = passwordProblem(password);
  if (problem) return { error: problem };

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    `http://${headerList.get("host") ?? "localhost:3000"}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { error: "That password is too weak. Try a longer one." };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { error: "Too many sign-up emails were sent. Please wait a while and try again." };
    }
    return { error: `Could not create your account (${error.code ?? "no code"}: ${error.message})` };
  }

  // If email confirmation is ON, there is no session yet.
  if (!data.session) {
    return {
      message:
        "Account created! Check your email and click the confirmation link, then log in.",
    };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
