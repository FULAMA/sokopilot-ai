-- SOKOPILOT AI V1 baseline schema for a dedicated Supabase/PostgreSQL project.
-- Apply only to a NEW project after approval. Never apply to an existing Supabase project by assumption.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

do $$ begin create type public.app_role as enum ('owner','manager','sales'); exception when duplicate_object then null; end $$;
do $$ begin create type public.currency_code as enum ('USD','CDF','EUR'); exception when duplicate_object then null; end $$;
do $$ begin create type public.lead_status as enum ('new','qualified','proposal','won','lost'); exception when duplicate_object then null; end $$;
do $$ begin create type public.lead_source as enum ('whatsapp','facebook','instagram','website','referral','walk_in','email','qr','other'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_status as enum ('todo','done','snoozed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_channel as enum ('whatsapp','email','phone','in_person','other'); exception when duplicate_object then null; end $$;
do $$ begin create type public.campaign_status as enum ('draft','review','approved','scheduled','paused','completed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.campaign_channel as enum ('facebook','instagram','whatsapp','email','linkedin','tiktok','website','other'); exception when duplicate_object then null; end $$;
do $$ begin create type public.integration_status as enum ('not_connected','connected','error','disabled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.automation_status as enum ('draft','active','paused'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  preferred_language text not null default 'fr' check (char_length(preferred_language) between 2 and 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  city text not null default 'Kinshasa',
  country_code char(2) not null default 'CD',
  timezone text not null default 'Africa/Kinshasa',
  default_currency public.currency_code not null default 'USD',
  usd_to_cdf numeric(14,4) check (usd_to_cdf is null or usd_to_cdf > 0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'sales',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (org_id,user_id)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 160),
  company_name text,
  phone text,
  email text,
  status public.lead_status not null default 'new',
  source public.lead_source not null default 'other',
  source_detail text,
  owner_user_id uuid,
  estimated_value numeric(14,2) not null default 0 check (estimated_value >= 0),
  currency public.currency_code not null default 'USD',
  expected_close_date date,
  next_follow_up_at timestamptz,
  notes text,
  marketing_consent boolean not null default false,
  consent_captured_at timestamptz,
  opted_out boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles(id),
  updated_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id,id),
  foreign key (org_id,owner_user_id) references public.organization_memberships(org_id,user_id) on delete set null (owner_user_id),
  check (phone is not null or email is not null),
  check (not opted_out or marketing_consent = false)
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  description text,
  price numeric(14,2) not null default 0 check (price >= 0),
  currency public.currency_code not null default 'USD',
  cta_label text,
  cta_url text,
  is_active boolean not null default true,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id,id)
);

create table if not exists public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null,
  assigned_to uuid,
  title text not null check (char_length(trim(title)) between 2 and 200),
  channel public.task_channel not null default 'whatsapp',
  status public.task_status not null default 'todo',
  due_at timestamptz not null,
  completed_at timestamptz,
  message_draft text,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (org_id,lead_id) references public.leads(org_id,id) on delete cascade,
  foreign key (org_id,assigned_to) references public.organization_memberships(org_id,user_id) on delete set null (assigned_to)
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 180),
  objective text,
  channel public.campaign_channel not null,
  status public.campaign_status not null default 'draft',
  content text,
  scheduled_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id,id),
  foreign key (org_id,approved_by) references public.organization_memberships(org_id,user_id) on delete set null (approved_by),
  check (status <> 'approved' or (approved_by is not null and approved_at is not null)),
  check (status <> 'scheduled' or (approved_by is not null and approved_at is not null and scheduled_at is not null))
);

create table if not exists public.sales_outcomes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null,
  outcome public.lead_status not null check (outcome in ('won','lost')),
  realized_amount numeric(14,2) not null default 0 check (realized_amount >= 0),
  currency public.currency_code not null default 'USD',
  campaign_id uuid,
  closed_at timestamptz not null default now(),
  recorded_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  foreign key (org_id,lead_id) references public.leads(org_id,id) on delete cascade,
  foreign key (org_id,campaign_id) references public.campaigns(org_id,id) on delete set null (campaign_id)
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider ~ '^[a-z0-9_-]{2,64}$'),
  status public.integration_status not null default 'not_connected',
  external_account_label text,
  granted_scopes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  connected_by uuid,
  connected_at timestamptz,
  last_checked_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id,provider),
  foreign key (org_id,connected_by) references public.organization_memberships(org_id,user_id) on delete set null (connected_by),
  check (status <> 'connected' or connected_at is not null)
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  trigger_type text not null,
  action_type text not null,
  status public.automation_status not null default 'draft',
  requires_human_approval boolean not null default true check (requires_human_approval = true),
  configuration jsonb not null default '{}'::jsonb,
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (org_id,approved_by) references public.organization_memberships(org_id,user_id) on delete set null (approved_by),
  check (status <> 'active' or (approved_by is not null and approved_at is not null))
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 2 and 100),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.is_org_member(p_org_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.organization_memberships m
    where m.org_id = p_org_id and m.user_id = auth.uid() and m.is_active = true
  );
$$;

create or replace function private.has_org_role(p_org_id uuid, p_roles public.app_role[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.organization_memberships m
    where m.org_id = p_org_id and m.user_id = auth.uid()
      and m.is_active = true and m.role = any(p_roles)
  );
$$;

create or replace function private.can_view_org_teammate(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.organization_memberships mine
    join public.organization_memberships theirs on theirs.org_id = mine.org_id
    where mine.user_id = auth.uid() and mine.is_active = true
      and theirs.user_id = p_profile_id and theirs.is_active = true
  );
$$;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id,full_name)
  values (new.id,nullif(trim(new.raw_user_meta_data ->> 'full_name'),''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users for each row
  execute function private.handle_new_auth_user();

do $$
declare t text;
begin
  foreach t in array array['profiles','organizations','leads','offers','follow_up_tasks','campaigns','integration_connections','automation_rules'] loop
    execute format('drop trigger if exists set_updated_at on public.%I',t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()',t);
  end loop;
end $$;

create index if not exists idx_memberships_user on public.organization_memberships(user_id,is_active);
create index if not exists idx_leads_org_status on public.leads(org_id,status,created_at desc);
create index if not exists idx_leads_org_owner on public.leads(org_id,owner_user_id);
create index if not exists idx_leads_org_followup on public.leads(org_id,next_follow_up_at) where next_follow_up_at is not null;
create index if not exists idx_followups_org_due on public.follow_up_tasks(org_id,status,due_at);
create index if not exists idx_followups_lead on public.follow_up_tasks(org_id,lead_id);
create index if not exists idx_campaigns_org_schedule on public.campaigns(org_id,scheduled_at);
create index if not exists idx_outcomes_org_closed on public.sales_outcomes(org_id,closed_at desc);
create index if not exists idx_audit_org_created on public.audit_events(org_id,created_at desc);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.leads enable row level security;
alter table public.offers enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.campaigns enable row level security;
alter table public.sales_outcomes enable row level security;
alter table public.integration_connections enable row level security;
alter table public.automation_rules enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_team on public.profiles for select to authenticated
  using (id = auth.uid() or private.can_view_org_teammate(id));
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy organizations_select_member on public.organizations for select to authenticated
  using (private.is_org_member(id));
create policy organizations_update_managers on public.organizations for update to authenticated
  using (private.has_org_role(id,array['owner','manager']::public.app_role[]))
  with check (private.has_org_role(id,array['owner','manager']::public.app_role[]));

create policy memberships_select_member on public.organization_memberships for select to authenticated
  using (private.is_org_member(org_id));
create policy memberships_insert_owner_manager on public.organization_memberships for insert to authenticated
  with check (
    private.has_org_role(org_id,array['owner']::public.app_role[])
    or (private.has_org_role(org_id,array['manager']::public.app_role[]) and role <> 'owner')
  );
create policy memberships_update_owner_manager on public.organization_memberships for update to authenticated
  using (
    private.has_org_role(org_id,array['owner']::public.app_role[])
    or (private.has_org_role(org_id,array['manager']::public.app_role[]) and role <> 'owner')
  )
  with check (
    private.has_org_role(org_id,array['owner']::public.app_role[])
    or (private.has_org_role(org_id,array['manager']::public.app_role[]) and role <> 'owner')
  );
create policy memberships_delete_owner_manager on public.organization_memberships for delete to authenticated
  using (
    private.has_org_role(org_id,array['owner']::public.app_role[])
    or (private.has_org_role(org_id,array['manager']::public.app_role[]) and role <> 'owner')
  );

create policy leads_select_member on public.leads for select to authenticated using (private.is_org_member(org_id));
create policy leads_insert_member on public.leads for insert to authenticated
  with check (private.is_org_member(org_id) and created_by = auth.uid());
create policy leads_update_owner_manager_or_assignee on public.leads for update to authenticated
  using (
    private.has_org_role(org_id,array['owner','manager']::public.app_role[])
    or (private.has_org_role(org_id,array['sales']::public.app_role[]) and owner_user_id = auth.uid())
  )
  with check (
    private.has_org_role(org_id,array['owner','manager']::public.app_role[])
    or (private.has_org_role(org_id,array['sales']::public.app_role[]) and owner_user_id = auth.uid())
  );
create policy leads_delete_owner_manager on public.leads for delete to authenticated
  using (private.has_org_role(org_id,array['owner','manager']::public.app_role[]));

create policy offers_select_member on public.offers for select to authenticated using (private.is_org_member(org_id));
create policy offers_manage_owner_manager on public.offers for all to authenticated
  using (private.has_org_role(org_id,array['owner','manager']::public.app_role[]))
  with check (private.has_org_role(org_id,array['owner','manager']::public.app_role[]));

create policy followups_select_member on public.follow_up_tasks for select to authenticated using (private.is_org_member(org_id));
create policy followups_insert_member on public.follow_up_tasks for insert to authenticated
  with check (private.is_org_member(org_id) and created_by = auth.uid());
create policy followups_update_assigned_or_manager on public.follow_up_tasks for update to authenticated
  using (
    private.has_org_role(org_id,array['owner','manager']::public.app_role[])
    or assigned_to = auth.uid()
  )
  with check (
    private.has_org_role(org_id,array['owner','manager']::public.app_role[])
    or assigned_to = auth.uid()
  );
create policy followups_delete_manager on public.follow_up_tasks for delete to authenticated
  using (private.has_org_role(org_id,array['owner','manager']::public.app_role[]));

create policy campaigns_select_member on public.campaigns for select to authenticated using (private.is_org_member(org_id));
create policy campaigns_insert_owner_manager on public.campaigns for insert to authenticated
  with check (
    private.has_org_role(org_id,array['owner','manager']::public.app_role[])
    and (status not in ('approved','scheduled') or approved_by = auth.uid())
  );
create policy campaigns_update_owner_manager on public.campaigns for update to authenticated
  using (private.has_org_role(org_id,array['owner','manager']::public.app_role[]))
  with check (
    private.has_org_role(org_id,array['owner','manager']::public.app_role[])
    and (status not in ('approved','scheduled') or approved_by = auth.uid())
  );
create policy campaigns_delete_owner_manager on public.campaigns for delete to authenticated
  using (private.has_org_role(org_id,array['owner','manager']::public.app_role[]));

create policy outcomes_select_member on public.sales_outcomes for select to authenticated using (private.is_org_member(org_id));
create policy outcomes_insert_manager on public.sales_outcomes for insert to authenticated
  with check (private.has_org_role(org_id,array['owner','manager']::public.app_role[]) and recorded_by = auth.uid());
create policy outcomes_update_manager on public.sales_outcomes for update to authenticated
  using (private.has_org_role(org_id,array['owner','manager']::public.app_role[]))
  with check (private.has_org_role(org_id,array['owner','manager']::public.app_role[]));
create policy outcomes_delete_owner on public.sales_outcomes for delete to authenticated
  using (private.has_org_role(org_id,array['owner']::public.app_role[]));

create policy integrations_select_manager on public.integration_connections for select to authenticated
  using (private.has_org_role(org_id,array['owner','manager']::public.app_role[]));
-- No authenticated INSERT/UPDATE/DELETE: trusted OAuth callbacks own integration state.

create policy automations_select_member on public.automation_rules for select to authenticated using (private.is_org_member(org_id));
create policy automations_insert_owner_manager on public.automation_rules for insert to authenticated
  with check (
    private.has_org_role(org_id,array['owner','manager']::public.app_role[])
    and (status <> 'active' or approved_by = auth.uid())
  );
create policy automations_update_owner_manager on public.automation_rules for update to authenticated
  using (private.has_org_role(org_id,array['owner','manager']::public.app_role[]))
  with check (
    private.has_org_role(org_id,array['owner','manager']::public.app_role[])
    and (status <> 'active' or approved_by = auth.uid())
  );
create policy automations_delete_owner_manager on public.automation_rules for delete to authenticated
  using (private.has_org_role(org_id,array['owner','manager']::public.app_role[]));

create policy audit_select_member on public.audit_events for select to authenticated using (private.is_org_member(org_id));
-- No authenticated INSERT/UPDATE/DELETE: audit writes are server-side only.

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select,insert,update on public.profiles to authenticated;
grant select,update on public.organizations to authenticated;
grant select,insert,update,delete on public.organization_memberships to authenticated;
grant select,insert,update,delete on public.leads to authenticated;
grant select,insert,update,delete on public.offers to authenticated;
grant select,insert,update,delete on public.follow_up_tasks to authenticated;
grant select,insert,update,delete on public.campaigns to authenticated;
grant select,insert,update,delete on public.sales_outcomes to authenticated;
grant select on public.integration_connections to authenticated;
grant select,insert,update,delete on public.automation_rules to authenticated;
grant select on public.audit_events to authenticated;
grant usage,select on sequence public.audit_events_id_seq to authenticated;

revoke all on function private.is_org_member(uuid) from public,anon;
revoke all on function private.has_org_role(uuid,public.app_role[]) from public,anon;
revoke all on function private.can_view_org_teammate(uuid) from public,anon;
revoke all on function private.set_updated_at() from public,anon,authenticated;
revoke all on function private.handle_new_auth_user() from public,anon,authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid,public.app_role[]) to authenticated;
grant execute on function private.can_view_org_teammate(uuid) to authenticated;

commit;
