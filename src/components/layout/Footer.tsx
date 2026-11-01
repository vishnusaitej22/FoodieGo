import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-stone-900 text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="[&_span]:text-white">
            <Logo />
          </div>
          <p className="mt-3 max-w-xs text-sm text-stone-400">
            FoodieGo is a student portfolio project. All restaurants and menus
            shown are fictional demonstration data.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Company
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>About FoodieGo</li>
            <li>Privacy Policy</li>
            <li>Terms of Use</li>
            <li>Refund Policy</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Contact
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Email: hello@foodiego.example</li>
            <li>Phone: +91 00000 00000 (demo)</li>
            <li>India (demo address)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800 py-4 text-center text-xs text-stone-500">
        © 2026 FoodieGo. Demo project, not a real
        delivery service.
      </div>
    </footer>
  );
}
