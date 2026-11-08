-- =====================================================================
-- FoodieGo | Migration 004: cancel orders + manage addresses
-- Run ONCE in the Supabase SQL Editor (after 001, 002 and 003).
-- =====================================================================

-- ---------- Cancel an order (customers may only cancel THEIR OWN
--            order, and only while it is still "pending") ----------
create or replace function public.cancel_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row record;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- One atomic statement: if the restaurant confirms the order at the
  -- same moment, only one of the two updates can win.
  update public.orders
     set status = 'cancelled'
   where id = p_order_id
     and user_id = v_uid
     and status = 'pending'
  returning id, order_number, status into v_row;

  if not found then
    if exists (select 1 from public.orders where id = p_order_id and user_id = v_uid) then
      raise exception 'CANNOT_CANCEL';
    end if;
    raise exception 'ORDER_NOT_FOUND';
  end if;

  return jsonb_build_object(
    'id', v_row.id, 'order_number', v_row.order_number, 'status', v_row.status
  );
end;
$$;

-- ---------- Make one address the default ----------
-- (runs as the logged-in user, so Row Level Security still applies)
create or replace function public.set_default_address(p_address_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  perform 1 from public.user_addresses where id = p_address_id and user_id = v_uid;
  if not found then
    raise exception 'INVALID_ADDRESS';
  end if;

  update public.user_addresses
     set is_default = false
   where user_id = v_uid and is_default and id <> p_address_id;

  update public.user_addresses
     set is_default = true
   where id = p_address_id and user_id = v_uid;
end;
$$;

-- ---------- Delete an address (promotes another one if it was the default) ----------
create or replace function public.delete_address(p_address_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_was_default boolean;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  delete from public.user_addresses
   where id = p_address_id and user_id = v_uid
  returning is_default into v_was_default;

  if not found then
    raise exception 'INVALID_ADDRESS';
  end if;

  if v_was_default then
    update public.user_addresses
       set is_default = true
     where id = (
       select id from public.user_addresses
        where user_id = v_uid
        order by created_at desc
        limit 1
     );
  end if;
end;
$$;

-- ---------- Who may call what: logged-in users only ----------
revoke all on function public.cancel_order(uuid)        from public, anon, authenticated;
revoke all on function public.set_default_address(uuid) from public, anon, authenticated;
revoke all on function public.delete_address(uuid)      from public, anon, authenticated;

grant execute on function public.cancel_order(uuid)        to authenticated;
grant execute on function public.set_default_address(uuid) to authenticated;
grant execute on function public.delete_address(uuid)      to authenticated;
