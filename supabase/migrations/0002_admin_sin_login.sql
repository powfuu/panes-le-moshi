-- Panes le Moshi · plataforma sin login
-- El panel de pedidos se abre con un enlace privado que contiene una clave secreta.
-- En la base de datos solo se guarda el hash SHA-256 de la clave.

create table if not exists public.admin_keys (
  id         uuid primary key default gen_random_uuid(),
  key_hash   bytea not null unique,
  label      text not null default 'Panel',
  created_at timestamptz not null default now()
);
alter table public.admin_keys enable row level security;
revoke all on public.admin_keys from anon, authenticated;

create or replace function public.check_admin_key(p_key text)
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce(length(p_key) >= 32, false)
     and exists (select 1 from public.admin_keys k where k.key_hash = extensions.digest(p_key, 'sha256'));
$$;
revoke all on function public.check_admin_key(text) from public, anon, authenticated;

-- Listado de pedidos para el panel.
create or replace function public.admin_list_orders(p_key text)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions
as $$
begin
  if not public.check_admin_key(p_key) then
    raise exception 'Enlace de acceso no válido.' using errcode = '42501';
  end if;
  return coalesce((
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
  ), '[]'::jsonb);
end;
$$;

-- Cambio de estado desde el panel (las reglas del trigger orders_guard siguen aplicando).
drop function if exists public.admin_set_status(uuid, public.order_status);
create or replace function public.admin_set_status(p_key text, p_order_id uuid, p_status public.order_status)
returns public.order_status
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.check_admin_key(p_key) then
    raise exception 'Enlace de acceso no válido.' using errcode = '42501';
  end if;
  update public.orders set status = p_status where id = p_order_id;
  if not found then
    raise exception 'Pedido no encontrado.' using errcode = 'P0001';
  end if;
  return p_status;
end;
$$;

revoke all on function public.admin_list_orders(text) from public;
revoke all on function public.admin_set_status(text, uuid, public.order_status) from public;
grant execute on function public.admin_list_orders(text) to anon, authenticated;
grant execute on function public.admin_set_status(text, uuid, public.order_status) to anon, authenticated;

-- Retirar todo lo relacionado con cuentas de usuario.
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated using (active);
drop policy if exists "products_admin_write" on public.products;
drop policy if exists "zones_public_read" on public.delivery_zones;
create policy "zones_public_read" on public.delivery_zones for select to anon, authenticated using (active);
drop policy if exists "orders_admin_read" on public.orders;
drop policy if exists "order_items_admin_read" on public.order_items;
drop policy if exists "history_admin_read" on public.order_status_history;
drop table if exists public.admin_users;
drop function if exists public.is_admin();
revoke all on public.orders, public.order_items, public.order_status_history from authenticated;

do $$ begin
  alter publication supabase_realtime drop table public.orders;
exception when others then null; end $$;
