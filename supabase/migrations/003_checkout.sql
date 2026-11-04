-- =====================================================================
-- FoodieGo | Migration 003: coupons + secure checkout functions
-- Run ONCE in the Supabase SQL Editor (after 001 and 002).
--
-- Why functions? A customer's browser must never be trusted with prices.
-- These functions run INSIDE the database and recalculate everything
-- (prices, availability, coupon, tax, delivery fee, total) themselves.
-- =====================================================================

-- ---------- Demo coupons ----------
insert into public.coupons
  (code, description, discount_type, discount_value, max_discount, min_order_amount)
values
  ('WELCOME50', 'Flat Rs.50 off on orders of Rs.199 or more (demo)', 'flat',    50, null, 199),
  ('FOODIE20',  '20% off up to Rs.100 on orders of Rs.249 or more (demo)', 'percent', 20, 100,  249)
on conflict (code) do nothing;

-- ---------- Internal calculator (NOT callable from the website) ----------
create or replace function public.compute_order_internal(
  p_restaurant_id uuid,
  p_items         jsonb,
  p_coupon        text,
  p_uid           uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c_tax_rate constant numeric := 0.05;          -- 5% GST (demo value)
  v_issues   text[]  := '{}';
  v_req      jsonb;
  v_rest     record;
  v_lines    jsonb   := '[]'::jsonb;
  v_unavail  jsonb   := '[]'::jsonb;
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_fee      numeric(10,2) := 0;
  v_tax      numeric(10,2) := 0;
  v_total    numeric(10,2) := 0;
  v_min      numeric(10,2) := 0;
  v_code     text := null;
  v_cp       record;
  v_coupon   text := upper(btrim(coalesce(p_coupon, '')));
begin
  -- 1. Read and merge the requested items: [{menu_item_id, quantity}, ...]
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    v_issues := array_append(v_issues, 'empty_cart');
  elsif jsonb_array_length(p_items) > 60 then
    v_issues := array_append(v_issues, 'too_many_items');
  else
    begin
      select jsonb_agg(jsonb_build_object('id', s.id, 'qty', s.qty))
        into v_req
        from (
          select (e ->> 'menu_item_id')::uuid as id,
                 sum((e ->> 'quantity')::int)  as qty
          from jsonb_array_elements(p_items) e
          group by 1
        ) s;
    exception when others then
      v_req := null;
      v_issues := array_append(v_issues, 'bad_request');
    end;

    if v_req is not null then
      if jsonb_array_length(v_req) > 30 then
        v_issues := array_append(v_issues, 'too_many_items');
      end if;
      if exists (
        select 1 from jsonb_to_recordset(v_req) as r(id uuid, qty int)
        where r.qty < 1 or r.qty > 20
      ) then
        v_issues := array_append(v_issues, 'bad_quantity');
      end if;
    end if;
  end if;

  -- 2. Restaurant must exist and be active
  select r.id, r.name, r.slug, r.delivery_fee, r.min_order
    into v_rest
    from public.restaurants r
   where r.id = p_restaurant_id and r.is_active;

  if not found then
    v_issues := array_append(v_issues, 'restaurant_unavailable');
  else
    v_fee := v_rest.delivery_fee;
    v_min := v_rest.min_order;
  end if;

  -- 3. Look up REAL prices; items must belong to this restaurant,
  --    be active and be available.
  if v_req is not null and found then
    select coalesce(jsonb_agg(jsonb_build_object(
             'menu_item_id', m.id,
             'name',         m.name,
             'unit_price',   m.price,
             'quantity',     r.qty,
             'line_total',   m.price * r.qty,
             'is_veg',       m.is_veg
           ) order by m.name), '[]'::jsonb),
           coalesce(sum(m.price * r.qty), 0)
      into v_lines, v_subtotal
      from jsonb_to_recordset(v_req) as r(id uuid, qty int)
      join public.menu_items m
        on m.id = r.id
       and m.restaurant_id = p_restaurant_id
       and m.is_active
       and m.is_available;

    select coalesce(jsonb_agg(r.id), '[]'::jsonb)
      into v_unavail
      from jsonb_to_recordset(v_req) as r(id uuid, qty int)
     where not exists (
       select 1 from public.menu_items m
        where m.id = r.id
          and m.restaurant_id = p_restaurant_id
          and m.is_active and m.is_available
     );

    if jsonb_array_length(v_unavail) > 0 then
      v_issues := array_append(v_issues, 'item_unavailable');
    end if;
    if v_subtotal < v_min and jsonb_array_length(v_lines) > 0 then
      v_issues := array_append(v_issues, 'below_min_order');
    end if;
  end if;

  -- 4. Coupon (only for logged-in users)
  if v_coupon <> '' then
    if p_uid is null then
      v_issues := array_append(v_issues, 'login_required');
    else
      select c.* into v_cp
        from public.coupons c
       where c.code = v_coupon
         and c.is_active
         and (c.expires_at is null or c.expires_at > now())
         and c.min_order_amount <= v_subtotal;

      if not found then
        v_issues := array_append(v_issues, 'invalid_coupon');
      else
        v_code := v_cp.code;
        if v_cp.discount_type = 'percent' then
          v_discount := round(v_subtotal * v_cp.discount_value / 100, 2);
          if v_cp.max_discount is not null then
            v_discount := least(v_discount, v_cp.max_discount);
          end if;
        else
          v_discount := v_cp.discount_value;
        end if;
        v_discount := least(v_discount, v_subtotal);
      end if;
    end if;
  end if;

  -- 5. Tax and total
  v_tax   := round((v_subtotal - v_discount) * c_tax_rate, 2);
  v_total := v_subtotal - v_discount + v_fee + v_tax;

  return jsonb_build_object(
    'restaurant',    case when v_rest.id is null then null
                          else jsonb_build_object('id', v_rest.id, 'name', v_rest.name, 'slug', v_rest.slug) end,
    'lines',         v_lines,
    'subtotal',      v_subtotal,
    'discount',      v_discount,
    'delivery_fee',  v_fee,
    'tax',           v_tax,
    'total',         v_total,
    'coupon_code',   v_code,
    'min_order',     v_min,
    'unavailable_ids', v_unavail,
    'issues',        to_jsonb(v_issues)
  );
end;
$$;

-- ---------- Quote: what WOULD this cart cost? (safe for everyone) ----------
create or replace function public.quote_order(
  p_restaurant_id uuid,
  p_items         jsonb,
  p_coupon        text default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.compute_order_internal(
    p_restaurant_id, p_items, p_coupon, (select auth.uid())
  );
$$;

-- ---------- Place the order (atomic: all or nothing) ----------
create or replace function public.place_order(
  p_restaurant_id uuid,
  p_items         jsonb,
  p_address_id    uuid,
  p_coupon        text default null,
  p_notes         text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_calc   jsonb;
  v_addr   record;
  v_order  record;
  v_recent int;
  v_notes  text := nullif(btrim(coalesce(p_notes, '')), '');
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Basic abuse protection: at most 5 orders per 10 minutes per user
  select count(*) into v_recent
    from public.orders
   where user_id = v_uid and created_at > now() - interval '10 minutes';
  if v_recent >= 5 then
    raise exception 'RATE_LIMITED';
  end if;

  if v_notes is not null and char_length(v_notes) > 300 then
    raise exception 'NOTES_TOO_LONG';
  end if;

  v_calc := public.compute_order_internal(p_restaurant_id, p_items, p_coupon, v_uid);
  if jsonb_array_length(v_calc -> 'issues') > 0 then
    raise exception 'ORDER_INVALID: %', (v_calc -> 'issues') ->> 0;
  end if;

  -- The address must belong to the person placing the order
  select * into v_addr
    from public.user_addresses
   where id = p_address_id and user_id = v_uid;
  if not found then
    raise exception 'INVALID_ADDRESS';
  end if;

  insert into public.orders (
    user_id, restaurant_id, restaurant_name,
    delivery_name, delivery_phone, delivery_address, delivery_pincode,
    subtotal, discount_amount, delivery_fee, tax_amount, total_amount,
    coupon_code, notes
  ) values (
    v_uid, p_restaurant_id, (v_calc -> 'restaurant') ->> 'name',
    v_addr.recipient_name, v_addr.phone,
    concat_ws(', ', v_addr.line1, nullif(v_addr.line2, ''), v_addr.city, v_addr.state),
    v_addr.pincode,
    (v_calc ->> 'subtotal')::numeric,
    (v_calc ->> 'discount')::numeric,
    (v_calc ->> 'delivery_fee')::numeric,
    (v_calc ->> 'tax')::numeric,
    (v_calc ->> 'total')::numeric,
    v_calc ->> 'coupon_code',
    v_notes
  )
  returning id, order_number into v_order;

  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, is_veg)
  select v_order.id,
         (l ->> 'menu_item_id')::uuid,
         l ->> 'name',
         (l ->> 'unit_price')::numeric,
         (l ->> 'quantity')::int,
         (l ->> 'is_veg')::boolean
    from jsonb_array_elements(v_calc -> 'lines') l;

  return jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number);
end;
$$;

-- ---------- Who may call what ----------
revoke all on function public.compute_order_internal(uuid, jsonb, text, uuid)
  from public, anon, authenticated;

revoke all on function public.quote_order(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.quote_order(uuid, jsonb, text) to anon, authenticated;

revoke all on function public.place_order(uuid, jsonb, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.place_order(uuid, jsonb, uuid, text, text) to authenticated;
