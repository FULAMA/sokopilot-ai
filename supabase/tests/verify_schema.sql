-- Post-migration structural checks. These do not replace authenticated user-level tests.
do $$
declare
  v_missing text;
begin
  select string_agg(x.table_name, ', ')
    into v_missing
  from (values
    ('profiles'), ('organizations'), ('organization_memberships'), ('leads'), ('offers'),
    ('follow_up_tasks'), ('campaigns'), ('sales_outcomes'), ('integration_connections'),
    ('automation_rules'), ('audit_events')
  ) as x(table_name)
  where not exists (
    select 1 from information_schema.tables t
    where t.table_schema = 'public' and t.table_name = x.table_name
  );
  if v_missing is not null then
    raise exception 'Missing tables: %', v_missing;
  end if;

  select string_agg(c.relname, ', ')
    into v_missing
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname in ('profiles','organizations','organization_memberships','leads','offers',
      'follow_up_tasks','campaigns','sales_outcomes','integration_connections','automation_rules','audit_events')
    and not c.relrowsecurity;
  if v_missing is not null then
    raise exception 'RLS not enabled on: %', v_missing;
  end if;

  select string_agg(x.table_name, ', ')
    into v_missing
  from (values ('organizations'), ('organization_memberships'), ('leads'), ('offers'),
    ('follow_up_tasks'), ('campaigns'), ('sales_outcomes'), ('integration_connections'),
    ('automation_rules'), ('audit_events')) as x(table_name)
  where not exists (
    select 1 from pg_trigger tr
    join pg_class c on c.oid = tr.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = x.table_name
      and tr.tgname = 'guard_tenant_mutations' and not tr.tgisinternal
  );
  if v_missing is not null then
    raise exception 'Missing tenant/actor guard triggers: %', v_missing;
  end if;

  if not exists (
    select 1 from pg_trigger tr
    join pg_class c on c.oid = tr.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'organization_memberships'
      and tr.tgname = 'ensure_active_organization_owner'
      and tr.tgdeferrable and tr.tginitdeferred and not tr.tgisinternal
  ) then
    raise exception 'Deferred active-owner constraint trigger is missing';
  end if;

  if not exists (
    select 1 from pg_trigger tr
    join pg_class c on c.oid = tr.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'audit_events'
      and tr.tgname = 'audit_events_append_only' and not tr.tgisinternal
  ) then
    raise exception 'Append-only audit trigger is missing';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.audit_events'::regclass
      and confrelid = 'public.organizations'::regclass
      and confdeltype = 'r'
  ) then
    raise exception 'Audit history must restrict organization deletion';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.integration_connections'::regclass
      and conname = 'integration_connections_metadata_no_secrets'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.automation_rules'::regclass
      and conname = 'automation_rules_configuration_no_secrets'
  ) then
    raise exception 'JSONB credential-key constraints are missing';
  end if;

  if has_function_privilege('authenticated', 'private.ensure_active_organization_owner()', 'EXECUTE')
     or has_function_privilege('authenticated', 'private.guard_tenant_row_mutations()', 'EXECUTE')
     or has_function_privilege('authenticated', 'private.reject_audit_event_mutation()', 'EXECUTE') then
    raise exception 'Internal trigger functions must not be executable by authenticated clients';
  end if;
  if not has_function_privilege('authenticated', 'private.jsonb_has_sensitive_key(jsonb)', 'EXECUTE') then
    raise exception 'Authenticated role needs execute on the safe JSONB CHECK validator';
  end if;
end $$;

select 'SOKOPILOT schema hardening checks passed' as result;
