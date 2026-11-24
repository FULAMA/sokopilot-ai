-- SOKOPILOT AI - V1 tenant/security hardening
-- Apply after 0001_initial_schema.sql on a fresh, dedicated PostgreSQL/Supabase project.
-- This migration does not provision a project or connect to an existing Supabase instance.

begin;

-- Never allow tenant reassignment or mutation of original actor attribution.
create or replace function private.guard_tenant_row_mutations()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      if tg_table_name = any(array[
        'organizations','leads','offers','follow_up_tasks','campaigns','automation_rules'
      ]) then
        new.created_by := auth.uid();
      elsif tg_table_name = 'sales_outcomes' then
        new.recorded_by := auth.uid();
      end if;
    end if;

    if tg_table_name = 'leads' then
      new.updated_by := coalesce(auth.uid(), new.updated_by);
    elsif tg_table_name = 'campaigns' then
      if new.status in ('approved','scheduled') and auth.uid() is not null then
        new.approved_by := auth.uid();
        new.approved_at := now();
      end if;
    elsif tg_table_name = 'automation_rules' then
      if new.status = 'active' and auth.uid() is not null then
        new.approved_by := auth.uid();
        new.approved_at := now();
      end if;
    end if;
    return new;
  end if;

  if tg_table_name = 'organization_memberships' then
    if new.org_id is distinct from old.org_id or new.user_id is distinct from old.user_id then
      raise exception 'Membership identity is immutable' using errcode = '23514';
    end if;
  elsif to_jsonb(old) ? 'org_id' and to_jsonb(new) ? 'org_id' then
    if (to_jsonb(new)->>'org_id') is distinct from (to_jsonb(old)->>'org_id') then
      raise exception 'Tenant ownership is immutable' using errcode = '23514';
    end if;
  end if;

  if to_jsonb(old) ? 'created_by'
     and (to_jsonb(new)->>'created_by') is distinct from (to_jsonb(old)->>'created_by') then
    raise exception 'created_by is immutable' using errcode = '23514';
  end if;
  if to_jsonb(old) ? 'recorded_by'
     and (to_jsonb(new)->>'recorded_by') is distinct from (to_jsonb(old)->>'recorded_by') then
    raise exception 'recorded_by is immutable' using errcode = '23514';
  end if;
  if to_jsonb(old) ? 'actor_user_id'
     and (to_jsonb(new)->>'actor_user_id') is distinct from (to_jsonb(old)->>'actor_user_id') then
    raise exception 'actor_user_id is immutable' using errcode = '23514';
  end if;

  if tg_table_name = 'campaigns' then
    if old.approved_at is not null
       and (new.approved_by is distinct from old.approved_by or new.approved_at is distinct from old.approved_at) then
      raise exception 'Campaign approval attribution is immutable' using errcode = '23514';
    end if;
  elsif tg_table_name = 'automation_rules' then
    if old.approved_at is not null
       and (new.approved_by is distinct from old.approved_by or new.approved_at is distinct from old.approved_at) then
      raise exception 'Automation approval attribution is immutable' using errcode = '23514';
    end if;
  end if;

  if tg_table_name = 'leads' then
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  end if;
  return new;
end;
$$;

-- A tenant must retain at least one active owner. Deferred execution supports
-- atomic onboarding (organization and first owner membership in one transaction).
create or replace function private.ensure_active_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_owner_count integer;
begin
  v_org_id := coalesce(new.org_id, old.org_id);
  perform 1 from public.organizations where id = v_org_id for update;
  if not found then
    return null; -- the organization itself is being deleted
  end if;

  select count(*) into v_owner_count
  from public.organization_memberships
  where org_id = v_org_id and role = 'owner' and is_active = true;

  if v_owner_count = 0 then
    raise exception 'An organization must retain at least one active owner'
      using errcode = '23514';
  end if;
  return null;
end;
$$;

-- Credential-like JSON keys are rejected recursively. This is a guardrail,
-- not a substitute for keeping provider secrets in a server-side secret store.
create or replace function private.jsonb_has_sensitive_key(p_value jsonb)
returns boolean
language plpgsql
immutable
parallel safe
set search_path = ''
as $$
declare
  v_item record;
  v_key text;
begin
  if jsonb_typeof(p_value) = 'object' then
    for v_item in select key, value from jsonb_each(p_value) loop
      v_key := regexp_replace(lower(v_item.key), '[^a-z0-9]', '', 'g');
      if v_key = any(array[
        'apikey','accesstoken','refreshtoken','clientsecret',
        'secret','password','authorization','privatekey','token'
      ]) or private.jsonb_has_sensitive_key(v_item.value) then
        return true;
      end if;
    end loop;
  elsif jsonb_typeof(p_value) = 'array' then
    for v_item in select value from jsonb_array_elements(p_value) loop
      if private.jsonb_has_sensitive_key(v_item.value) then
        return true;
      end if;
    end loop;
  end if;
  return false;
end;
$$;

-- Keep audit history immutable and prevent organization deletion from silently
-- cascading away its audit trail. Retention/deletion needs a separate procedure.
create or replace function private.reject_audit_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit events are append-only' using errcode = '23514';
end;
$$;

-- Install tenant/actor guards on every table that carries tenant ownership or attribution.
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','organization_memberships','leads','offers','follow_up_tasks',
    'campaigns','sales_outcomes','integration_connections','automation_rules','audit_events'
  ] loop
    execute format('drop trigger if exists guard_tenant_mutations on public.%I', t);
    execute format(
      'create trigger guard_tenant_mutations before insert or update on public.%I
       for each row execute function private.guard_tenant_row_mutations()', t
    );
  end loop;
end $$;

drop trigger if exists ensure_active_organization_owner on public.organization_memberships;
create constraint trigger ensure_active_organization_owner
  after insert or update or delete on public.organization_memberships
  deferrable initially deferred
  for each row execute function private.ensure_active_organization_owner();

drop trigger if exists audit_events_append_only on public.audit_events;
create trigger audit_events_append_only
  before update or delete on public.audit_events
  for each row execute function private.reject_audit_event_mutation();

-- Preserve actor identity even if the corresponding Auth profile is later deleted.
alter table public.audit_events
  drop constraint if exists audit_events_actor_user_id_fkey;
alter table public.audit_events
  drop constraint if exists audit_events_org_id_fkey;
alter table public.audit_events
  add constraint audit_events_org_id_fkey
  foreign key (org_id) references public.organizations(id) on delete restrict;

alter table public.integration_connections
  add constraint integration_connections_metadata_no_secrets
  check (not private.jsonb_has_sensitive_key(metadata));

alter table public.automation_rules
  add constraint automation_rules_configuration_no_secrets
  check (not private.jsonb_has_sensitive_key(configuration));

-- Internal trigger functions are not callable by application clients.
revoke all on function private.guard_tenant_row_mutations() from public, anon, authenticated;
revoke all on function private.ensure_active_organization_owner() from public, anon, authenticated;
revoke all on function private.reject_audit_event_mutation() from public, anon, authenticated;
revoke all on function private.jsonb_has_sensitive_key(jsonb) from public, anon;
-- CHECK constraints execute as the writing role, so authenticated needs this safe pure validator.
grant execute on function private.jsonb_has_sensitive_key(jsonb) to authenticated;

commit;
