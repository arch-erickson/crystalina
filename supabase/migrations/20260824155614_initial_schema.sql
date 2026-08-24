-- Crystalina core storefront schema. This migration intentionally contains no seed data.
create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'admin', 'manager', 'technician', 'sales');
create type public.order_status as enum ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.review_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  category text not null,
  price_cents integer not null check (price_cents >= 0),
  compare_price_cents integer check (compare_price_cents is null or compare_price_cents >= price_cents),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  published boolean not null default false,
  image_path text,
  short_description text not null default '',
  description text not null default '',
  specs jsonb not null default '[]'::jsonb,
  badge text,
  installation_minutes integer not null default 30 check (installation_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'pending',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  tax_cents integer not null check (tax_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  shipping_address jsonb not null,
  installation_requested boolean not null default false,
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 2000),
  display_name text,
  borough text,
  status public.review_status not null default 'pending',
  verified_purchase boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index orders_user_created_at_idx on public.orders (user_id, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index reviews_product_created_at_idx on public.reviews (product_id, created_at desc);
create index published_products_category_idx on public.products (category, name) where published;

create schema if not exists private;
revoke all on schema private from public;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.user_roles
      where user_id = auth.uid() and role = required_role
    );
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');
  return new;
end;
$$;

revoke all on function private.has_role(public.app_role) from public;
revoke all on function private.handle_new_user() from public;
grant usage on schema private to authenticated;
grant execute on function private.has_role(public.app_role) to authenticated;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function private.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function private.set_updated_at();
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure private.handle_new_user();

grant usage on schema public to anon, authenticated;
grant select on public.products, public.reviews to anon;
grant select on public.profiles, public.user_roles, public.products, public.orders, public.order_items, public.reviews to authenticated;
grant update on public.profiles to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_staff_read" on public.profiles for select to authenticated
using (private.has_role('admin') or private.has_role('manager'));

create policy "roles_select_own" on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id);
create policy "roles_admin_manage" on public.user_roles for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));

create policy "products_public_read_published" on public.products for select to anon, authenticated
using (published);
create policy "products_staff_manage" on public.products for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('manager'));

create policy "orders_select_own" on public.orders for select to authenticated
using ((select auth.uid()) = user_id);
create policy "orders_staff_read" on public.orders for select to authenticated
using (private.has_role('admin') or private.has_role('manager'));
create policy "order_items_select_own" on public.order_items for select to authenticated
using (exists (select 1 from public.orders where orders.id = order_id and orders.user_id = (select auth.uid())));
create policy "order_items_staff_read" on public.order_items for select to authenticated
using (private.has_role('admin') or private.has_role('manager'));

create policy "reviews_public_read_approved" on public.reviews for select to anon, authenticated
using (status = 'approved');
create policy "reviews_select_own" on public.reviews for select to authenticated
using ((select auth.uid()) = user_id);
create policy "reviews_staff_manage" on public.reviews for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('manager'));
