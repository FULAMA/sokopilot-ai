-- Integration regression test: run only against a disposable local Supabase database.
-- Creates two organizations and three users, then verifies tenant isolation and guards.
begin;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tenant-a-owner@test.invalid', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tenant A Owner"}'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tenant-b-owner@test.invalid', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tenant B Owner"}'),
  ('30000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tenant-a-sales@test.invalid', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tenant A Sales"}');

insert into public.organizations (id, name, slug, created_by) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Tenant A', 'tenant-a-test', '10000000-0000-4000-8000-000000000001'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Tenant B', 'tenant-b-test', '20000000-0000-4000-8000-000000000002');

insert into public.organization_memberships (org_id, user_id, role) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '10000000-0000-4000-8000-000000000001', 'owner'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '30000000-0000-4000-8000-000000000003', 'sales'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '20000000-0000-4000-8000-000000000002', 'owner');

insert into public.leads (id, org_id, full_name, phone, created_by) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Lead A', '+243810000001', '10000000-0000-4000-8000-000000000001'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Lead B', '+243810000002', '20000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
do $$
begin
  if (select count(*) from public.leads) <> 1 then
    raise exception 'Tenant A must see exactly its own lead';
  end if;
  if exists (select 1 from public.leads where id = 'bbbbbbbb-0000-4000-8000-000000000002') then
    raise exception 'Tenant A can see Tenant B lead';
  end if;
  update public.leads set full_name = 'Cross-tenant tamper'
    where id = 'bbbbbbbb-0000-4000-8000-000000000002';
  if found then
    raise exception 'Cross-tenant update unexpectedly affected a row';
  end if;
end $$;

reset role;

-- Direct SQL must not be able to reassign a row to a different tenant or persist credential keys.
do $$
begin
  begin
    update public.leads set org_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      where id = 'aaaaaaaa-0000-4000-8000-000000000001';
    raise exception 'Tenant reassignment unexpectedly succeeded';
  exception when check_violation then null;
  end;
  begin
    insert into public.integration_connections (org_id, provider, metadata)
      values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'test-provider', '{"access_token":"must-not-persist"}');
    raise exception 'Credential-shaped integration metadata unexpectedly persisted';
  exception when check_violation then null;
  end;
  begin
    insert into public.automation_rules (org_id, name, trigger_type, action_type, configuration)
      values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Unsafe config', 'manual', 'manual', '{"nested":{"client_secret":"must-not-persist"}}');
    raise exception 'Credential-shaped automation config unexpectedly persisted';
  exception when check_violation then null;
  end;
end $$;

-- A sales member cannot promote itself to owner.
set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
do $$
begin
  begin
    update public.organization_memberships set role = 'owner'
      where org_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        and user_id = '30000000-0000-4000-8000-000000000003';
    raise exception 'Sales member unexpectedly promoted itself';
  exception when insufficient_privilege then null;
  end;
end $$;

-- The sole active owner cannot demote itself.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
do $$
begin
  begin
    update public.organization_memberships set role = 'manager'
      where org_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        and user_id = '10000000-0000-4000-8000-000000000001';
    set constraints ensure_active_organization_owner immediate;
    raise exception 'Last active owner was unexpectedly demoted';
  exception when check_violation then null;
  end;
  set constraints ensure_active_organization_owner deferred;
end $$;

rollback;
