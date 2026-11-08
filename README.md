# FoodieGo

A food ordering and delivery web app, inspired by the general usability of Swiggy and Zomato. It is a **student portfolio project**. All restaurants, dishes, ratings and delivery times are fictional demonstration data, and payment is **Cash on Delivery only**.

## Features

**Customers**
- Browse restaurants, search, filter by cuisine / rating / pure veg / offers, and sort
- Restaurant pages with menus grouped by category
- Shopping cart that survives page refreshes (one restaurant per cart)
- Sign up, log in, log out, and a profile page
- Saved delivery addresses (add, edit, delete, choose a default)
- Checkout with demo coupons, Cash on Delivery, and an order confirmation page
- Order history, a progress tracker for each order, and cancelling a pending order

**Admin**
- Protected admin area (role stored in the database, never taken from the browser)
- Dashboard with basic statistics
- Manage categories, restaurants and menu items (items are deactivated rather than deleted)
- View, search and filter all orders, and move them through the allowed statuses

## Tech stack

Next.js (App Router) with TypeScript, React, Tailwind CSS, Lucide icons, Supabase (PostgreSQL, Auth, Row Level Security), deployed to Vercel.

## Security design

- Row Level Security is switched on for every table. Customers can only read their own orders and addresses.
- Prices, delivery fee, tax, coupons and totals are calculated **inside the database** (`place_order`, `quote_order`), never trusted from the browser.
- Order history keeps price snapshots, so later menu changes do not alter past orders.
- Order status can only move forward (`pending → confirmed → preparing → out_for_delivery → delivered`), can be cancelled until delivered, and delivered or cancelled orders are final. A database trigger enforces this.
- Admin pages and admin actions each verify the admin role on the server.
- Only the public Supabase URL and publishable key are used. No secret keys are in the code.

## Run it locally

1. Install Node.js (LTS) and Git.
2. Clone the repository and install packages:
   ```bash
   git clone https://github.com/vishnusaitej22/FoodieGo.git
   cd FoodieGo
   npm install
   ```
3. Create a free project at [supabase.com](https://supabase.com).
4. In the Supabase **SQL Editor**, run these files from `supabase/migrations/` **in order, once each**:
   `001_schema.sql`, `002_seed.sql`, `003_checkout.sql`, `004_account.sql`, `005_admin_orders.sql`
5. Copy `.env.example` to `.env.local` and fill in your project's URL and **publishable** key (Supabase → Project Settings → API).
6. In Supabase → Authentication → URL Configuration, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/**` as a redirect URL.
7. Start the app:
   ```bash
   npm run dev
   ```

### Make yourself an admin

Sign up on the site first, then run this in the Supabase SQL Editor (use your own email):

```sql
insert into public.admin_roles (user_id)
select id from auth.users where email = 'you@example.com';
```

### Demo coupons

`WELCOME50` (₹50 off orders of ₹199+) and `FOODIE20` (20% off up to ₹100 on orders of ₹249+).

## Notes and limitations

- Supabase free projects pause after a week of inactivity. Restore the project from its dashboard before demonstrating.
- Vercel's free Hobby plan is for personal, non-commercial use, which fits a portfolio demo.
- Online payments are not implemented.
- Food photos currently use an image link entered by the admin. Uploading images is planned.

## Roadmap

Image uploads (Supabase Storage), automated tests, and production deployment steps.
