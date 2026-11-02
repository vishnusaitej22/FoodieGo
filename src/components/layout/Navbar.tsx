"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Menu, ShoppingCart, User, X } from "lucide-react";
import Logo from "./Logo";
import { logout } from "@/app/auth/actions";

type NavUser = { fullName: string; email: string } | null;

export default function Navbar({ user }: { user: NavUser }) {
  const displayName = user ? user.fullName.split(" ")[0] || "Account" : "";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur">
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-6">
          <Logo />
          <button
            type="button"
            className="hidden items-center gap-1 text-sm text-stone-600 hover:text-orange-600 md:flex"
          >
            <MapPin size={16} aria-hidden="true" />
            <span className="font-medium">Select location</span>
          </button>
        </div>

        {/* Desktop links */}
        <div className="hidden items-center gap-2 md:flex">
          <a
            href="#restaurants"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            Restaurants
          </a>
          <a
            href="#offers"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            Offers
          </a>
          {user ? (
            <>
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                <User size={18} aria-hidden="true" />
                {displayName}
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              <User size={18} aria-hidden="true" />
              Log in
            </Link>
          )}
          <button
            type="button"
            className="relative flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            aria-label="Cart, 0 items"
          >
            <ShoppingCart size={18} aria-hidden="true" />
            Cart
            <span className="rounded-full bg-white px-2 text-xs font-bold text-orange-600">
              0
            </span>
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <a
              href="#restaurants"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 font-medium text-stone-700 hover:bg-stone-100"
            >
              Restaurants
            </a>
            <a
              href="#offers"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 font-medium text-stone-700 hover:bg-stone-100"
            >
              Offers
            </a>
            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 font-medium text-stone-700 hover:bg-stone-100"
                >
                  My account ({displayName})
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full rounded-lg px-3 py-2 text-left font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 font-medium text-stone-700 hover:bg-stone-100"
              >
                Log in
              </Link>
            )}
            <button
              type="button"
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white"
            >
              <ShoppingCart size={18} aria-hidden="true" />
              Cart (0)
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
