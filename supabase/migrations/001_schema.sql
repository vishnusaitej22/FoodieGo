-- =====================================================================
-- FoodieGo | Migration 001: tables, security helpers, RLS policies
-- Run this ONCE in the Supabase SQL Editor.
-- =====================================================================

-- ---------- Helper: keep updated_at current ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1. ADMIN ROLES (who is an admin). Customers can NEVER write here.
-- =====================================================================
create table public.admin_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_roles enable row level security;

-- Helper used by every admin policy. SECURITY DEFINER lets it read
-- admin_roles safely. It only answers "is the CURRENT user an admin?".
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- A signed-in user may read ONLY their own admin row.
-- There is no INSERT / UPDATE / DELETE policy, so nobody can
-- grant themselves admin through the API.
create policy "admin_roles: read own row"
  on public.admin_roles for select
  to authenticated
  using (user_id = (select auth.uid()));

-- =====================================================================
-- 2. PROFILES (one row per user, created automatically at signup)
-- =====================================================================
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text check (char_length(full_name) <= 100),
  phone      text check (phone is null or phone ~ '^[0-9+ ()-]{7,15}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Create the profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 3. USER ADDRESSES (private to each user)
-- =====================================================================
create table public.user_addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  label          text not null default 'Home' check (char_length(label) between 1 and 30),
  recipient_name text not null check (char_length(recipient_name) between 1 and 100),
  phone          text not null check (phone ~ '^[0-9+ ()-]{7,15}$'),
  line1          text not null check (char_length(line1) between 1 and 200),
  line2          text check (char_length(line2) <= 200),
  city           text not null check (char_length(city) between 1 and 80),
  state          text not null check (char_length(state) between 1 and 80),
  pincode        text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index user_addresses_user_id_idx on public.user_addresses (user_id);
-- At most one default address per user
create unique index user_addresses_one_default_idx
  on public.user_addresses (user_id) where is_default;

create trigger user_addresses_set_updated_at
  before update on public.user_addresses
  for each row execute function public.set_updated_at();

alter table public.user_addresses enable row level security;

create policy "addresses: read own"
  on public.user_addresses for select to authenticated
  using (user_id = (select auth.uid()));

create policy "addresses: insert own"
  on public.user_addresses for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "addresses: update own"
  on public.user_addresses for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "addresses: delete own"
  on public.user_addresses for delete to authenticated
  using (user_id = (select auth.uid()));

-- =====================================================================
-- 4. FOOD CATEGORIES (public to read, admin to change)
-- =====================================================================
create table public.food_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(name) between 1 and 50),
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  emoji      text,
  sort_order int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.food_categories enable row level security;

create policy "categories: public read active"
  on public.food_categories for select to anon, authenticated
  using (is_active or public.is_admin());

create policy "categories: admin insert"
  on public.food_categories for insert to authenticated
  with check (public.is_admin());

create policy "categories: admin update"
  on public.food_categories for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "categories: admin delete"
  on public.food_categories for delete to authenticated
  using (public.is_admin());

-- =====================================================================
-- 5. RESTAURANTS
-- =====================================================================
create table public.restaurants (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 100),
  slug             text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description      text check (char_length(description) <= 500),
  image_url        text,
  cuisines         text[] not null default '{}',
  rating           numeric(2,1) not null default 0 check (rating between 0 and 5),
  delivery_minutes int not null default 30 check (delivery_minutes between 5 and 180),
  min_order        numeric(10,2) not null default 0 check (min_order >= 0),
  delivery_fee     numeric(10,2) not null default 0 check (delivery_fee >= 0),
  is_veg           boolean not null default false,
  offer_text       text check (char_length(offer_text) <= 100),
  is_active        boolean not null default true,
  is_demo          boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index restaurants_active_rating_idx on public.restaurants (is_active, rating desc);

create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

alter table public.restaurants enable row level security;

create policy "restaurants: public read active"
  on public.restaurants for select to anon, authenticated
  using (is_active or public.is_admin());

create policy "restaurants: admin insert"
  on public.restaurants for insert to authenticated
  with check (public.is_admin());

create policy "restaurants: admin update"
  on public.restaurants for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "restaurants: admin delete"
  on public.restaurants for delete to authenticated
  using (public.is_admin());

-- =====================================================================
-- 6. MENU ITEMS
-- =====================================================================
create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id   uuid references public.food_categories (id) on delete set null,
  name          text not null check (char_length(name) between 1 and 100),
  description   text check (char_length(description) <= 300),
  price         numeric(10,2) not null check (price > 0 and price <= 100000),
  image_url     text,
  is_veg        boolean not null default true,
  is_available  boolean not null default true,  -- temporarily out of stock
  is_active     boolean not null default true,  -- soft delete
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index menu_items_restaurant_idx on public.menu_items (restaurant_id);
create index menu_items_category_idx on public.menu_items (category_id);

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

alter table public.menu_items enable row level security;

create policy "menu_items: public read active"
  on public.menu_items for select to anon, authenticated
  using (
    public.is_admin()
    or (
      is_active
      and exists (
        select 1 from public.restaurants r
        where r.id = restaurant_id and r.is_active
      )
    )
  );

create policy "menu_items: admin insert"
  on public.menu_items for insert to authenticated
  with check (public.is_admin());

create policy "menu_items: admin update"
  on public.menu_items for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "menu_items: admin delete"
  on public.menu_items for delete to authenticated
  using (public.is_admin());

-- =====================================================================
-- 7. COUPONS (hidden from customers; validated by a server function later)
-- =====================================================================
create table public.coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique check (code = upper(code) and code ~ '^[A-Z0-9]{3,20}$'),
  description      text,
  discount_type    text not null check (discount_type in ('percent', 'flat')),
  discount_value   numeric(10,2) not null check (discount_value > 0),
  max_discount     numeric(10,2) check (max_discount is null or max_discount > 0),
  min_order_amount numeric(10,2) not null default 0 check (min_order_amount >= 0),
  is_active        boolean not null default true,
  expires_at       timestamptz,
  created_at       timestamptz not null default now(),
  constraint coupons_percent_range
    check (discount_type <> 'percent' or discount_value <= 100)
);

alter table public.coupons enable row level security;

-- Only admins can see or change coupons. Customers get no direct access,
-- so nobody can list all coupon codes.
create policy "coupons: admin read"
  on public.coupons for select to authenticated
  using (public.is_admin());

create policy "coupons: admin insert"
  on public.coupons for insert to authenticated
  with check (public.is_admin());

create policy "coupons: admin update"
  on public.coupons for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "coupons: admin delete"
  on public.coupons for delete to authenticated
  using (public.is_admin());

-- =====================================================================
-- 8. ORDERS  (payment status is separate from order status)
-- =====================================================================
create sequence public.order_number_seq start 1001;

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique
                     default ('FG' || nextval('public.order_number_seq')::text),
  user_id          uuid references auth.users (id) on delete set null,
  restaurant_id    uuid not null references public.restaurants (id) on delete restrict,
  restaurant_name  text not null,   -- snapshot, stays correct if renamed
  status           text not null default 'pending'
                     check (status in ('pending','confirmed','preparing',
                                       'out_for_delivery','delivered','cancelled')),
  payment_method   text not null default 'cod' check (payment_method in ('cod')),
  payment_status   text not null default 'pending'
                     check (payment_status in ('pending','paid','failed','refunded')),
  -- Delivery address snapshot (copied at checkout)
  delivery_name    text not null,
  delivery_phone   text not null,
  delivery_address text not null,
  delivery_pincode text not null,
  -- Money (all calculated on the server)
  subtotal         numeric(10,2) not null check (subtotal >= 0),
  discount_amount  numeric(10,2) not null default 0 check (discount_amount >= 0),
  delivery_fee     numeric(10,2) not null default 0 check (delivery_fee >= 0),
  tax_amount       numeric(10,2) not null default 0 check (tax_amount >= 0),
  total_amount     numeric(10,2) not null check (total_amount >= 0),
  coupon_code      text,
  notes            text check (char_length(notes) <= 300),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_restaurant_idx on public.orders (restaurant_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Even an admin may only change status and payment_status.
-- This protects order history and money fields from tampering.
create or replace function public.orders_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id               is distinct from old.id
  or new.order_number     is distinct from old.order_number
  or new.user_id          is distinct from old.user_id
  or new.restaurant_id    is distinct from old.restaurant_id
  or new.restaurant_name  is distinct from old.restaurant_name
  or new.payment_method   is distinct from old.payment_method
  or new.delivery_name    is distinct from old.delivery_name
  or new.delivery_phone   is distinct from old.delivery_phone
  or new.delivery_address is distinct from old.delivery_address
  or new.delivery_pincode is distinct from old.delivery_pincode
  or new.subtotal         is distinct from old.subtotal
  or new.discount_amount  is distinct from old.discount_amount
  or new.delivery_fee     is distinct from old.delivery_fee
  or new.tax_amount       is distinct from old.tax_amount
  or new.total_amount     is distinct from old.total_amount
  or new.coupon_code      is distinct from old.coupon_code
  or new.notes            is distinct from old.notes
  or new.created_at       is distinct from old.created_at
  then
    raise exception 'Only status and payment_status can be changed on an order';
  end if;
  return new;
end;
$$;

create trigger orders_guard_update_trigger
  before update on public.orders
  for each row execute function public.orders_guard_update();

alter table public.orders enable row level security;

create policy "orders: read own or admin"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- Customers get NO insert policy: orders are created only by a secure
-- server function (Phase 6) that recalculates every price itself.

create policy "orders: admin update"
  on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 9. ORDER ITEMS (price snapshots)
-- =====================================================================
create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  item_name    text not null,                -- snapshot
  unit_price   numeric(10,2) not null check (unit_price > 0),  -- snapshot
  quantity     int not null check (quantity between 1 and 50),
  is_veg       boolean not null default true,
  line_total   numeric(10,2) generated always as (unit_price * quantity) stored
);

create index order_items_order_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

create policy "order_items: read own or admin"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or public.is_admin())
    )
  );
-- No insert/update/delete policies: only the secure order function writes here.

-- =====================================================================
-- 10. TABLE PERMISSIONS (RLS above decides WHICH rows; GRANT decides
--     whether the table can be touched at all)
-- =====================================================================
revoke all on all tables in schema public from anon, authenticated;

grant select on public.food_categories, public.restaurants, public.menu_items
  to anon, authenticated;

grant select on public.admin_roles, public.profiles, public.user_addresses,
                public.orders, public.order_items, public.coupons
  to authenticated;

grant update (full_name, phone) on public.profiles to authenticated;
grant insert, update, delete on public.user_addresses to authenticated;

grant insert, update, delete on public.food_categories, public.restaurants,
                                public.menu_items, public.coupons
  to authenticated;

grant update (status, payment_status) on public.orders to authenticated;
