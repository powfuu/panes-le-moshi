-- Panes le Moshi · panel de pedidos con PIN (sin cuentas)
-- El PIN se guarda con bcrypt. Los intentos fallidos se limitan por IP y globalmente.
-- Las funciones no lanzan excepción ante un PIN incorrecto para que el intento fallido quede registrado.

drop function if exists public.admin_list_orders(text);
drop function if exists public.admin_set_status(text, uuid, public.order_status);
drop function if exists public.check_admin_key(text);
drop table if exists public.admin_keys;

create table if not exists public.admin_pins (
  id         uuid primary key default gen_random_uuid(),
  pin_hash   text not null,
  label      text not null default 'Panel',
  created_at timestamptz not null default now()
);

create table if not exists public.admin_login_attempts (
  id  bigint generated always as identity primary key,
  ip  text not null,
  at  timestamptz not null default now()
);
create index if not exists admin_login_attempts_ip_at on public.admin_login_attempts(ip, at desc);

alter table public.admin_pins enable row level security;
alter table public.admin_login_attempts enable row level security;
revoke all on public.admin_pins, public.admin_login_attempts from anon, authenticated;

create or replace function public.request_ip()
returns text
language sql stable
as $$
  select coalesce(
    nullif(btrim(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1)), ''),
    current_setting('request.headers', true)::json ->> 'cf-connecting-ip',
    'desconocida'
  );
$$;

-- Devuelve 'ok', 'invalid' o 'locked'.
create or replace function public.check_admin_pin(p_pin text)
returns text
language plpgsql volatile security definer set search_path = public, extensions
as $$
declare
  v_ip text := public.request_ip();
begin
  if (select count(*) from public.admin_login_attempts where ip = v_ip and at > now() - interval '15 minutes') >= 10
     or (select count(*) from public.admin_login_attempts where at > now() - interval '1 hour') >= 300 then
    return 'locked';
  end if;

  if p_pin is not null and length(p_pin) between 4 and 64
     and exists (select 1 from public.admin_pins where pin_hash = extensions.crypt(p_pin, pin_hash)) then
    return 'ok';
  end if;

  insert into public.admin_login_attempts(ip) values (v_ip);
  delete from public.admin_login_attempts where at < now() - interval '2 days';
  return 'invalid';
end;
$$;
revoke all on function public.check_admin_pin(text) from public, anon, authenticated;

-- { ok: true, orders: [...] } o { ok: false, reason: 'invalid' | 'locked' }
create or replace function public.admin_list_orders(p_pin text)
returns jsonb
language plpgsql volatile security definer set search_path = public, extensions
as $$
declare
  v_check text := public.check_admin_pin(p_pin);
begin
  if v_check <> 'ok' then
    return jsonb_build_object('ok', false, 'reason', v_check);
  end if;
  return jsonb_build_object('ok', true, 'orders', coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
    from (
      select o.id, o.code, o.status, o.customer_name, o.phone, o.email, o.zone_slug, o.address,
             o.address_notes, o.delivery_date, o.delivery_slot, o.notes, o.cash_change_for_cents,
             o.total_cents, o.created_at, o.updated_at,
             coalesce((select jsonb_agg(jsonb_build_object('product_name', i.product_name, 'quantity', i.quantity))
                       from public.order_items i where i.order_id = o.id), '[]'::jsonb) as order_items
      from public.orders o
      order by o.created_at desc
      limit 500
    ) t
  ), '[]'::jsonb));
end;
$$;

-- { ok: true, status } o { ok: false, reason }. Las reglas del trigger orders_guard siguen aplicando.
create or replace function public.admin_set_status(p_pin text, p_order_id uuid, p_status public.order_status)
returns jsonb
language plpgsql volatile security definer set search_path = public, extensions
as $$
declare
  v_check text := public.check_admin_pin(p_pin);
begin
  if v_check <> 'ok' then
    return jsonb_build_object('ok', false, 'reason', v_check);
  end if;
  update public.orders set status = p_status where id = p_order_id;
  if not found then
    raise exception 'Pedido no encontrado.' using errcode = 'P0001';
  end if;
  return jsonb_build_object('ok', true, 'status', p_status);
end;
$$;

revoke all on function public.admin_list_orders(text) from public;
revoke all on function public.admin_set_status(text, uuid, public.order_status) from public;
grant execute on function public.admin_list_orders(text) to anon, authenticated;
grant execute on function public.admin_set_status(text, uuid, public.order_status) to anon, authenticated;

-- El PIN se inserta aparte (no se guarda en el repositorio):
-- insert into public.admin_pins(pin_hash) values (extensions.crypt('PIN', extensions.gen_salt('bf', 10)));
