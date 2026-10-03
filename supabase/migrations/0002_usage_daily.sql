-- One row per (owner, day) counting AI calls.
-- A signed-in member is counted by user_id only, never by IP, so a shared
-- café Wi-Fi cannot drain a paying member's daily quota.
-- Anonymous visitors are counted by a salted IP hash.

create table if not exists public.usage_daily (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  ip_hash text,
  day date not null,
  ai_count int not null default 0,
  constraint usage_user_day unique (user_id, day),
  constraint usage_ip_day unique (ip_hash, day),
  constraint usage_has_owner check (user_id is not null or ip_hash is not null)
);

alter table public.usage_daily enable row level security;

drop policy if exists "read own usage" on public.usage_daily;
create policy "read own usage" on public.usage_daily
  for select using (auth.uid() = user_id);

-- Atomic increment. The read-then-write approach would lose counts when two
-- requests race, so the counter is bumped inside the database.
create or replace function public.increment_ai_usage(
  p_user_id uuid,
  p_ip_hash text,
  p_day date
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_user_id is not null then
    insert into public.usage_daily (user_id, ip_hash, day, ai_count)
    values (p_user_id, null, p_day, 1)
    on conflict (user_id, day) do update
      set ai_count = public.usage_daily.ai_count + 1
      returning ai_count into v_count;
  else
    insert into public.usage_daily (user_id, ip_hash, day, ai_count)
    values (null, p_ip_hash, p_day, 1)
    on conflict (ip_hash, day) do update
      set ai_count = public.usage_daily.ai_count + 1
      returning ai_count into v_count;
  end if;
  return v_count;
end;
$$;

-- Only the server may spend credits. Without this revoke, the public anon key
-- could inflate or drain anyone's counter.
revoke all on function public.increment_ai_usage(uuid, text, date) from public;
grant execute on function public.increment_ai_usage(uuid, text, date) to service_role;