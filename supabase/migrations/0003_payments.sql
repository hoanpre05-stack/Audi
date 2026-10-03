-- Append-only ledger of every PayOS order. Rows are never deleted so a
-- duplicate webhook can always be detected and ignored.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  payos_order_code bigint not null unique,
  amount int not null check (amount in (79000, 790000)),
  plan_kind text not null check (plan_kind in ('monthly','yearly')),
  status text not null default 'pending' check (status in ('pending','paid','cancelled','expired')),
  paid_at timestamptz,
  raw_webhook jsonb,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "read own payments" on public.payments;
create policy "read own payments" on public.payments
  for select using (auth.uid() = user_id);

create index if not exists payments_user_created_idx
  on public.payments (user_id, created_at desc);