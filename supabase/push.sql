create table if not exists public.sala404_push_subscriptions (
 endpoint text primary key, keys jsonb not null, created_at timestamptz not null default now()
);
alter table public.sala404_push_subscriptions enable row level security;
revoke all on public.sala404_push_subscriptions from anon,authenticated;
grant select,insert,update,delete on public.sala404_push_subscriptions to service_role;
create table if not exists public.sala404_push_receipts (
 lead_id uuid references public.sala404_leads(id) on delete cascade,
 endpoint text references public.sala404_push_subscriptions(endpoint) on delete cascade,
 sent_at timestamptz not null default now(), primary key(lead_id,endpoint)
);
create index if not exists sala404_receipts_endpoint on public.sala404_push_receipts(endpoint);
alter table public.sala404_push_receipts enable row level security;
revoke all on public.sala404_push_receipts from anon,authenticated;
grant select,insert,delete on public.sala404_push_receipts to service_role;
