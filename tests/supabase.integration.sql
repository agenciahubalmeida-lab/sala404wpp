-- Executar explicitamente no projeto selecionado. Tudo é desfeito no final.
begin;
set local role service_role;
do $$
declare allowed boolean; test_id uuid; claimed integer;
begin
 if has_table_privilege('anon','public.sala404_leads','SELECT') or
    has_table_privilege('authenticated','public.sala404_leads','INSERT') then
   raise exception 'Public lead access must be denied';
 end if;
 if has_function_privilege('anon','public.claim_sala404_deliveries(uuid)','EXECUTE') then
   raise exception 'Public queue execution must be denied';
 end if;
 if not (select relrowsecurity from pg_class where oid='public.sala404_leads'::regclass) then
   raise exception 'RLS must be enabled';
 end if;
 for i in 1..9 loop
   allowed := public.sala404_allow_request('sala404-transaction-test');
   if allowed <> (i<=8) then raise exception 'Rate limit failure'; end if;
 end loop;
 insert into public.sala404_leads(name,phone,profession,internet_sales,best_month,reason,source_url,consent,consent_version)
 values('Teste transacional','transaction-test-only','teste','teste','teste','teste','https://example.test',true,'test') returning id into test_id;
 begin
   insert into public.sala404_leads(name,phone,profession,internet_sales,best_month,reason,source_url,consent,consent_version)
   values('Teste duplicado','transaction-test-only','teste','teste','teste','teste','https://example.test',true,'test');
   raise exception 'Duplicate phone accepted';
 exception when unique_violation then null;
 end;
 select count(*) into claimed from public.claim_sala404_deliveries(test_id);
 if claimed<>1 then raise exception 'Queue did not claim job'; end if;
 select count(*) into claimed from public.claim_sala404_deliveries(test_id);
 if claimed<>0 then raise exception 'Queue lease did not protect job'; end if;
end $$;
rollback;
select 'PASS: RLS, grants, uniqueness, rate limiting and queue lease; test rolled back' as result;
