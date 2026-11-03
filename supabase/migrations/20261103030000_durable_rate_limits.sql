-- Crystalina: a rate limit that survives the request that made it.
--
-- R3. The limiter in api/_lib/http.mjs counts in a Map in process memory.
-- A Worker isolate is short lived and there are many of them at once, so
-- each one starts from zero and the limit is per isolate rather than per
-- caller. It blunts a double submit and almost nothing else.
--
-- This moves the count somewhere shared. One row per bucket, a fixed
-- window, and a single function that increments and decides in one
-- statement so two requests arriving together cannot both read "4 of 5".
--
-- Cloudflare WAF rate limiting is still the better answer when the domain
-- is on Cloudflare: it rejects at the edge before a Worker or a database
-- is touched at all. This is what can be done today, on infrastructure
-- that already exists, and it is a great deal better than counting in
-- memory.

create table if not exists public.rate_limits (
  bucket text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

-- Written only by the server boundary with the service role. Row level
-- security on with no policy denies everyone else, which is the point:
-- a caller who could read this could work out how close they are.
drop policy if exists "rate_limits are server only" on public.rate_limits;

-- ---------------------------------------------------------------- --
-- consume_rate_limit
--
-- Increments the bucket and says whether this request is allowed. The
-- insert and the decision are one statement, so concurrent callers
-- cannot both see the same count: the row is locked by the upsert.
--
-- A window that has expired is reset rather than accumulated, which is a
-- fixed window rather than a sliding one. Fixed windows allow a burst at
-- a boundary; that is an acceptable trade for one round trip and no
-- extra storage.
-- ---------------------------------------------------------------- --
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, resets_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_start timestamptz;
begin
  insert into public.rate_limits (bucket, count, window_start)
  values (p_bucket, 1, now())
  on conflict (bucket) do update
    set count = case
          when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then 1
          else public.rate_limits.count + 1
        end,
        window_start = case
          when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then now()
          else public.rate_limits.window_start
        end
  returning public.rate_limits.count, public.rate_limits.window_start
  into v_count, v_start;

  return query select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    v_start + make_interval(secs => p_window_seconds);
end;
$$;

-- An index for the sweep below, which would otherwise scan the table.
create index if not exists rate_limits_window_start_idx
  on public.rate_limits (window_start);

-- ---------------------------------------------------------------- --
-- Housekeeping. Nothing expires these rows on its own, so without this
-- the table grows by one row per distinct caller forever. Call it from a
-- scheduled job once that exists; until then it is here to be run by
-- hand and, more importantly, to be obvious that it is needed.
-- ---------------------------------------------------------------- --
create or replace function public.prune_rate_limits(p_older_than_hours integer default 24)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limits
   where window_start < now() - make_interval(hours => p_older_than_hours);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.prune_rate_limits(integer) from public, anon, authenticated;
