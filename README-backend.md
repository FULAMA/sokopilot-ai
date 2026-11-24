# SOKOPILOT AI — Backend foundation (V1)

This package contains a proposed Supabase/PostgreSQL foundation and a separate tenant-security hardening migration.

## Safety rule

**Do not run these migrations against an existing Supabase project.** They are intended for a newly created, dedicated SOKOPILOT project only. Existing Supabase projects must remain untouched unless explicitly authorized.

## Migration order

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_tenant_security_hardening.sql`

## Verification

- `supabase/tests/verify_schema.sql`: structural checks for RLS, tenant guards, owner protection, JSONB secret-key constraints and append-only audit.
- `supabase/tests/tenant_isolation.sql`: disposable-database integration test with two organizations and authenticated users. It rolls back all fixtures.

These checks have not yet been executed against a live or local PostgreSQL instance in this environment. Do not interpret CI success for the frontend as database security validation.

## Before deployment

1. Create or select a new SOKOPILOT-only Supabase project after explicit approval; never reuse existing projects by assumption.
2. Confirm region, plan, cost, backup and retention requirements.
3. Apply both migrations in order.
4. Keep the `private` schema unexposed in the Supabase Data API.
5. Configure Auth redirect URLs and email settings.
6. Implement trusted server-side organization onboarding, audit writes and OAuth callbacks. Never expose a service-role key in browser code.
7. Run both SQL verification scripts and Supabase Security Advisors before onboarding real customer data.

## Deliberate V1 exclusions

No outbound WhatsApp/SMS/email, payment processing, credential storage, automatic campaign sending or fictional live data is enabled by these migrations. The frontend remains a demo until a separate backend integration is implemented.
