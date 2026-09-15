-- =========================================================
-- BizLink AI Africa — 011_rate_limiting.sql
-- Rate limiting persistant et atomique via PostgreSQL
-- =========================================================

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0 check (count >= 0),
  window_start timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rate_limits_expires_at
  on public.rate_limits(expires_at);

alter table public.rate_limits enable row level security;

revoke all on table public.rate_limits from anon, authenticated;

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_count integer;
  v_expires_at timestamptz;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'rate limit key is required';
  end if;

  if length(trim(p_key)) > 200 then
    raise exception 'rate limit key is too long';
  end if;

  if p_limit < 1 then
    raise exception 'rate limit must be greater than zero';
  end if;

  if p_window_seconds < 1 then
    raise exception 'rate limit window must be greater than zero';
  end if;

  insert into public.rate_limits (
    key,
    count,
    window_start,
    expires_at,
    created_at,
    updated_at
  )
  values (
    p_key,
    1,
    v_now,
    v_now + make_interval(secs => p_window_seconds),
    v_now,
    v_now
  )
  on conflict (key) do update
  set
    count = case
      when rate_limits.expires_at <= v_now then 1
      else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.expires_at <= v_now then v_now
      else rate_limits.window_start
    end,
    expires_at = case
      when rate_limits.expires_at <= v_now
        then v_now + make_interval(secs => p_window_seconds)
      else rate_limits.expires_at
    end,
    updated_at = v_now
  returning
    rate_limits.count,
    rate_limits.expires_at
  into
    v_count,
    v_expires_at;

  return query
  select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    v_expires_at;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer)
  from public, anon, authenticated;

grant execute on function public.check_rate_limit(text, integer, integer)
  to service_role;

create or replace function public.cleanup_expired_rate_limits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.rate_limits
  where expires_at < now() - interval '1 hour';

  get diagnostics v_deleted = row_count;

  return v_deleted;
end;
$$;

revoke all on function public.cleanup_expired_rate_limits()
  from public, anon, authenticated;

grant execute on function public.cleanup_expired_rate_limits()
  to service_role;
