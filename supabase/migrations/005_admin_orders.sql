-- =====================================================================
-- FoodieGo | Migration 005: safe order status changes for the admin
-- Run ONCE in the Supabase SQL Editor (after 001 to 004).
--
-- Orders can only move forward:
--   pending -> confirmed -> preparing -> out_for_delivery -> delivered
-- and may be cancelled until they are delivered. "delivered" and
-- "cancelled" are final. The database enforces this, so even a bug in the
-- website could not break the rule.
-- =====================================================================
create or replace function public.orders_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Only status and payment_status may ever change
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

  -- Status may only move along the allowed path
  if new.status is distinct from old.status then
    if not (
      (old.status = 'pending'          and new.status in ('confirmed', 'cancelled')) or
      (old.status = 'confirmed'        and new.status in ('preparing', 'cancelled')) or
      (old.status = 'preparing'        and new.status in ('out_for_delivery', 'cancelled')) or
      (old.status = 'out_for_delivery' and new.status in ('delivered', 'cancelled'))
    ) then
      raise exception 'INVALID_STATUS_CHANGE: % to %', old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;
