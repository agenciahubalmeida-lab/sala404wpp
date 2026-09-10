-- Execute uma vez no SQL Editor do projeto Supabase escolhido.
create table if not exists public.sala404_leads (
 id uuid primary key default gen_random_uuid(), name text not null, phone text not null unique,
 profession text not null, internet_sales text not null, best_month text not null, reason text not null,
 created_at timestamptz not null default now(), source_url text not null, referrer text,
 utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text, fbclid text,
 consent boolean not null check(consent), consent_version text not null, marketing_consent boolean not null default false,
 meta_payload jsonb, meta_sent boolean not null default false, notification_sent boolean not null default false,
 attempts integer not null default 0, delivery_after timestamptz not null default now(), delivery_error text
);
alter table public.sala404_leads enable row level security;
revoke all on public.sala404_leads from anon, authenticated;
grant select,insert,update,delete on public.sala404_leads to service_role;
create index if not exists sala404_delivery_pending on public.sala404_leads(delivery_after) where not meta_sent or not notification_sent;
create or replace function public.claim_sala404_deliveries(target_id uuid default null)
returns setof public.sala404_leads language sql security invoker set search_path='' as $$
 update public.sala404_leads set delivery_after=now()+interval '5 minutes', attempts=attempts+1
 where id in (select id from public.sala404_leads where (not meta_sent or not notification_sent)
 and delivery_after<=now() and (target_id is null or id=target_id) order by delivery_after limit 2 for update skip locked)
 returning *;
$$;
revoke all on function public.claim_sala404_deliveries(uuid) from public,anon,authenticated;
grant execute on function public.claim_sala404_deliveries(uuid) to service_role;
create table if not exists public.sala404_rate_limits(bucket text primary key, started_at timestamptz not null default now(), hits integer not null default 1);
alter table public.sala404_rate_limits enable row level security;
revoke all on public.sala404_rate_limits from anon,authenticated;
grant select,insert,update,delete on public.sala404_rate_limits to service_role;
create or replace function public.sala404_allow_request(bucket_key text) returns boolean language plpgsql security invoker set search_path='' as $$
declare hit_count integer;
begin
 delete from public.sala404_rate_limits where started_at<now()-interval '1 day';
 insert into public.sala404_rate_limits(bucket) values(bucket_key) on conflict(bucket) do update
 set hits=case when public.sala404_rate_limits.started_at<now()-interval '10 minutes' then 1 else public.sala404_rate_limits.hits+1 end,
 started_at=case when public.sala404_rate_limits.started_at<now()-interval '10 minutes' then now() else public.sala404_rate_limits.started_at end returning hits into hit_count;
 return hit_count<=8;
end; $$;
revoke all on function public.sala404_allow_request(text) from public,anon,authenticated;
grant execute on function public.sala404_allow_request(text) to service_role;
