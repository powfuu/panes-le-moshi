-- Panes le Moshi · esquema inicial
-- Todas las escrituras de clientes pasan por funciones RPC (security definer).
-- Las tablas de pedidos no son accesibles directamente para usuarios anónimos.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum (
    'procesando', 'en_preparacion', 'listo', 'en_reparto', 'entregado', 'cancelado'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  description   text not null,
  price_cents   integer not null check (price_cents > 0),
  weight_label  text,
  badge         text,
  variant       text not null default 'clasico',
  sort_order    integer not null default 0,
  max_per_order integer not null default 20 check (max_per_order between 1 and 100),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.delivery_zones (
  slug               text primary key,
  name               text not null,
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  min_order_cents    integer not null default 0 check (min_order_cents >= 0),
  sort_order         integer not null default 0,
  active             boolean not null default true
);

create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique,
  access_token          uuid not null default gen_random_uuid(),
  status                public.order_status not null default 'procesando',
  customer_name         text not null check (char_length(customer_name) between 2 and 80),
  phone                 text not null check (phone ~ '^\+?[0-9]{9,15}$'),
  email                 text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  zone_slug             text not null references public.delivery_zones(slug),
  address               text not null check (char_length(address) between 5 and 200),
  address_notes         text check (char_length(address_notes) <= 200),
  delivery_date         date not null,
  delivery_slot         text not null check (delivery_slot in ('manana', 'tarde')),
  notes                 text check (char_length(notes) <= 500),
  payment_method        text not null default 'efectivo' check (payment_method = 'efectivo'),
  cash_change_for_cents integer check (cash_change_for_cents is null or cash_change_for_cents > 0),
  subtotal_cents        integer not null check (subtotal_cents >= 0),
  delivery_fee_cents    integer not null check (delivery_fee_cents >= 0),
  total_cents           integer not null check (total_cents >= 0),
  cancel_reason         text check (char_length(cancel_reason) <= 300),
  cancelled_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_phone_idx on public.orders(phone, created_at desc);

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       uuid not null references public.products(id),
  product_name     text not null,
  unit_price_cents integer not null check (unit_price_cents > 0),
  quantity         integer not null check (quantity between 1 and 100),
  line_total_cents integer not null check (line_total_cents > 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.order_status_history (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     public.order_status not null,
  changed_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history(order_id, changed_at);

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.status_rank(s public.order_status)
returns integer
language sql immutable
as $$
  select case s
    when 'procesando' then 1
    when 'en_preparacion' then 2
    when 'listo' then 3
    when 'en_reparto' then 4
    when 'entregado' then 5
    else 0
  end;
$$;

create or replace function public.normalize_phone(p text)
returns text
language sql immutable
as $$
  select case
    when regexp_replace(coalesce(p, ''), '[^0-9+]', '', 'g') ~ '^\+'
      then '+' || regexp_replace(p, '[^0-9]', '', 'g')
    else regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g')
  end;
$$;

-- ---------------------------------------------------------------------------
-- Reglas de estado (se aplican a TODO el mundo, incluido el panel admin)
--   * Cancelar SOLO es posible desde "procesando".
--   * Entregado y cancelado son estados finales.
--   * Solo se avanza o retrocede un paso cada vez.
-- ---------------------------------------------------------------------------
create or replace function public.orders_guard()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if old.status in ('entregado', 'cancelado') then
      raise exception 'El pedido ya está finalizado y no se puede modificar.' using errcode = 'P0001';
    end if;

    if new.status = 'cancelado' then
      if old.status <> 'procesando' then
        raise exception 'Solo se puede cancelar un pedido mientras está en "Procesando pedido".' using errcode = 'P0001';
      end if;
      new.cancelled_at := now();
    elsif abs(public.status_rank(new.status) - public.status_rank(old.status)) <> 1 then
      raise exception 'Cambio de estado no permitido.' using errcode = 'P0001';
    end if;
  end if;

  -- Campos inmutables
  new.id := old.id;
  new.code := old.code;
  new.access_token := old.access_token;
  new.created_at := old.created_at;
  new.payment_method := 'efectivo';
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before update on public.orders
for each row execute function public.orders_guard();

create or replace function public.orders_log_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history(order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists orders_log_status on public.orders;
create trigger orders_log_status after insert or update of status on public.orders
for each row execute function public.orders_log_status();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select to anon, authenticated using (active or public.is_admin());

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "zones_public_read" on public.delivery_zones;
create policy "zones_public_read" on public.delivery_zones
  for select to anon, authenticated using (active or public.is_admin());

drop policy if exists "orders_admin_read" on public.orders;
create policy "orders_admin_read" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "order_items_admin_read" on public.order_items;
create policy "order_items_admin_read" on public.order_items
  for select to authenticated using (public.is_admin());

drop policy if exists "history_admin_read" on public.order_status_history;
create policy "history_admin_read" on public.order_status_history
  for select to authenticated using (public.is_admin());

drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- Defensa en profundidad: los anónimos no tocan las tablas de pedidos.
revoke all on public.orders, public.order_items, public.order_status_history, public.admin_users from anon;
revoke insert, update, delete on public.orders, public.order_items, public.order_status_history, public.admin_users from authenticated;
revoke insert, update, delete on public.products, public.delivery_zones from anon;

-- ---------------------------------------------------------------------------
-- RPC: crear pedido (precios y totales SIEMPRE calculados en el servidor)
-- p_items: [{"product_id": "...", "quantity": 2}, ...]
-- ---------------------------------------------------------------------------
create or replace function public.create_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_zone text,
  p_address text,
  p_address_notes text,
  p_delivery_date date,
  p_delivery_slot text,
  p_notes text,
  p_cash_change_for_cents integer,
  p_items jsonb
)
returns table (code text, access_token uuid, total_cents integer)
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  v_zone public.delivery_zones;
  v_phone text := public.normalize_phone(p_phone);
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_subtotal integer := 0;
  v_total integer;
  v_code text;
  v_order_id uuid;
  v_token uuid;
  v_item jsonb;
  v_product public.products;
  v_qty integer;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_recent integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Tu pedido está vacío.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'Demasiados productos en un solo pedido.' using errcode = 'P0001';
  end if;

  select * into v_zone from public.delivery_zones z where z.slug = p_zone and z.active;
  if not found then
    raise exception 'Por ahora solo repartimos en Arteixo, Carballo y A Coruña.' using errcode = 'P0001';
  end if;

  if p_delivery_date is null or p_delivery_date < v_today + 1 or p_delivery_date > v_today + 90 then
    raise exception 'Elige una fecha de entrega a partir de mañana.' using errcode = 'P0001';
  end if;

  if v_phone !~ '^\+?[0-9]{9,15}$' then
    raise exception 'Revisa el teléfono: necesitamos un número válido para avisarte.' using errcode = 'P0001';
  end if;

  -- Límite anti-abuso: máximo 3 pedidos activos por teléfono en una hora.
  select count(*) into v_recent from public.orders o
   where o.phone = v_phone and o.created_at > now() - interval '1 hour' and o.status <> 'cancelado';
  if v_recent >= 3 then
    raise exception 'Has hecho varios pedidos seguidos. Espera un poco o escríbenos.' using errcode = 'P0001';
  end if;

  -- Validar líneas y calcular subtotal.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    select * into v_product from public.products p where p.id = (v_item->>'product_id')::uuid and p.active;
    if not found then
      raise exception 'Uno de los productos ya no está disponible.' using errcode = 'P0001';
    end if;
    if v_qty is null or v_qty < 1 or v_qty > v_product.max_per_order then
      raise exception 'Cantidad no válida para %.', v_product.name using errcode = 'P0001';
    end if;
    v_subtotal := v_subtotal + v_product.price_cents * v_qty;
  end loop;

  if v_subtotal < v_zone.min_order_cents then
    raise exception 'El pedido mínimo para % es de % €.', v_zone.name, to_char(v_zone.min_order_cents / 100.0, 'FM999990.00') using errcode = 'P0001';
  end if;

  v_total := v_subtotal + v_zone.delivery_fee_cents;

  if p_cash_change_for_cents is not null and p_cash_change_for_cents < v_total then
    raise exception 'El importe con el que pagarás debe cubrir el total.' using errcode = 'P0001';
  end if;

  -- Código legible y único: LM-XXXXXX
  loop
    v_code := 'LM-' || (
      select string_agg(substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from public.orders o where o.code = v_code);
  end loop;

  insert into public.orders(
    code, customer_name, phone, email, zone_slug, address, address_notes,
    delivery_date, delivery_slot, notes, cash_change_for_cents,
    subtotal_cents, delivery_fee_cents, total_cents
  ) values (
    v_code, btrim(p_customer_name), v_phone, nullif(btrim(coalesce(p_email, '')), ''), v_zone.slug,
    btrim(p_address), nullif(btrim(coalesce(p_address_notes, '')), ''),
    p_delivery_date, p_delivery_slot, nullif(btrim(coalesce(p_notes, '')), ''), p_cash_change_for_cents,
    v_subtotal, v_zone.delivery_fee_cents, v_total
  ) returning id, orders.access_token into v_order_id, v_token;

  insert into public.order_items(order_id, product_id, product_name, unit_price_cents, quantity, line_total_cents)
  select v_order_id, p.id, p.name, p.price_cents, agg.qty, p.price_cents * agg.qty
  from (
    select (e->>'product_id')::uuid as pid, sum((e->>'quantity')::integer)::integer as qty
    from jsonb_array_elements(p_items) e group by 1
  ) agg
  join public.products p on p.id = agg.pid;

  return query select v_code, v_token, v_total;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: ver pedido (requiere código + token secreto)
-- ---------------------------------------------------------------------------
create or replace function public.get_order(p_code text, p_token uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'code', o.code,
    'status', o.status,
    'customer_name', o.customer_name,
    'phone', o.phone,
    'zone', jsonb_build_object('slug', z.slug, 'name', z.name),
    'address', o.address,
    'address_notes', o.address_notes,
    'delivery_date', o.delivery_date,
    'delivery_slot', o.delivery_slot,
    'notes', o.notes,
    'payment_method', o.payment_method,
    'cash_change_for_cents', o.cash_change_for_cents,
    'subtotal_cents', o.subtotal_cents,
    'delivery_fee_cents', o.delivery_fee_cents,
    'total_cents', o.total_cents,
    'cancel_reason', o.cancel_reason,
    'cancelled_at', o.cancelled_at,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name, 'quantity', i.quantity,
        'unit_price_cents', i.unit_price_cents, 'line_total_cents', i.line_total_cents
      ) order by i.product_name)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object('status', h.status, 'changed_at', h.changed_at) order by h.changed_at)
      from public.order_status_history h where h.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  join public.delivery_zones z on z.slug = o.zone_slug
  where o.code = upper(btrim(p_code)) and o.access_token = p_token;
$$;

-- ---------------------------------------------------------------------------
-- RPC: localizar pedido con código + teléfono (devuelve el token)
-- ---------------------------------------------------------------------------
create or replace function public.find_order(p_code text, p_phone text)
returns uuid
language sql stable security definer set search_path = public
as $$
  select o.access_token from public.orders o
  where o.code = upper(btrim(p_code))
    and right(regexp_replace(o.phone, '[^0-9]', '', 'g'), 9) = right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 9)
    and length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) >= 9;
$$;

-- ---------------------------------------------------------------------------
-- RPC: cancelar (solo en "procesando"; el trigger lo garantiza igualmente)
-- ---------------------------------------------------------------------------
create or replace function public.cancel_order(p_code text, p_token uuid, p_reason text default null)
returns public.order_status
language plpgsql security definer set search_path = public
as $$
declare
  v_status public.order_status;
begin
  select status into v_status from public.orders
   where code = upper(btrim(p_code)) and access_token = p_token
   for update;
  if not found then
    raise exception 'No encontramos ese pedido.' using errcode = 'P0001';
  end if;
  if v_status <> 'procesando' then
    raise exception 'Tu pedido ya está en marcha y no se puede cancelar.' using errcode = 'P0001';
  end if;

  update public.orders
     set status = 'cancelado', cancel_reason = nullif(left(btrim(coalesce(p_reason, '')), 300), '')
   where code = upper(btrim(p_code)) and access_token = p_token;
  return 'cancelado';
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: cambiar estado desde el panel (solo administradores)
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_status(p_order_id uuid, p_status public.order_status)
returns public.order_status
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  update public.orders set status = p_status where id = p_order_id;
  if not found then
    raise exception 'Pedido no encontrado.' using errcode = 'P0001';
  end if;
  return p_status;
end;
$$;

revoke all on function public.create_order(text, text, text, text, text, text, date, text, text, integer, jsonb) from public;
revoke all on function public.get_order(text, uuid) from public;
revoke all on function public.find_order(text, text) from public;
revoke all on function public.cancel_order(text, uuid, text) from public;
revoke all on function public.admin_set_status(uuid, public.order_status) from public;

grant execute on function public.create_order(text, text, text, text, text, text, date, text, text, integer, jsonb) to anon, authenticated;
grant execute on function public.get_order(text, uuid) to anon, authenticated;
grant execute on function public.find_order(text, text) to anon, authenticated;
grant execute on function public.cancel_order(text, uuid, text) to anon, authenticated;
grant execute on function public.admin_set_status(uuid, public.order_status) to authenticated;
revoke execute on function public.admin_set_status(uuid, public.order_status) from anon;

-- ---------------------------------------------------------------------------
-- Realtime para el panel de administración (respeta RLS)
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Datos iniciales (editables desde el panel de Supabase)
-- ---------------------------------------------------------------------------
insert into public.delivery_zones(slug, name, delivery_fee_cents, min_order_cents, sort_order) values
  ('a-coruna', 'A Coruña', 0, 0, 1),
  ('arteixo',  'Arteixo',  0, 0, 2),
  ('carballo', 'Carballo', 0, 0, 3)
on conflict (slug) do nothing;

insert into public.products(slug, name, description, price_cents, weight_label, badge, variant, sort_order) values
  ('pan-de-jamon-clasico', 'Pan de jamón clásico',
   'La receta de siempre: masa dulce trenzada con jamón, tocineta, aceitunas y pasas, glaseada con papelón.',
   2000, 'Aprox. 1 kg · 8 raciones', 'El favorito', 'clasico', 1),
  ('pan-de-jamon-familiar', 'Pan de jamón familiar',
   'El mismo relleno generoso en tamaño de mesa grande, para la cena del 24 y lo que sobre el 25.',
   3000, 'Aprox. 1,6 kg · 12 raciones', 'Para la cena', 'familiar', 2),
  ('pan-de-jamon-sin-pasas', 'Pan de jamón sin pasas',
   'Para el equipo sin pasas: jamón, tocineta y aceitunas, sin discusiones en la mesa.',
   2000, 'Aprox. 1 kg · 8 raciones', null, 'sinpasas', 3),
  ('minipanes-de-jamon', 'Minipanes de jamón',
   'Caja de seis panecitos individuales. Perfectos para regalar o para el aperitivo.',
   1500, 'Caja de 6 unidades', 'Para regalar', 'mini', 4)
on conflict (slug) do nothing;
