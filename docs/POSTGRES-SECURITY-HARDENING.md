# SOKOPILOT AI — PostgreSQL tenant-security hardening

## Changes proposed in migration 0002

- Makes tenant ownership immutable after row creation across organization-scoped tables.
- Makes membership identity (organization and user) immutable.
- Makes original `created_by`, `recorded_by` and audit actor attribution immutable; server-side inserts derive actor identity from `auth.uid()` when available.
- Prevents a commit from leaving an organization without at least one active owner. A deferred constraint trigger supports atomic organization onboarding and locks the organization row to serialize competing owner-removal attempts.
- Rejects credential-like JSON keys recursively in integration metadata and automation configuration.
- Makes audit events append-only, preserves actor IDs when Auth profiles are deleted, and prevents organization deletion from silently cascading away audit history.
- Adds structural checks and a two-organization integration regression test.

## Required verification

The SQL has **not** been executed against PostgreSQL in this environment. No PostgreSQL client, Docker runtime, or dedicated Supabase project was available. The migration and tests are reviewable changes, not proof of production security.

Before any production use:

1. Run migrations 0001 and 0002 on a disposable local Supabase stack.
2. Run `supabase/tests/verify_schema.sql`.
3. Run `supabase/tests/tenant_isolation.sql`.
4. Expand tests to cover cross-tenant INSERT, every table's role matrix, owner deactivation/deletion, concurrent owner removal and approval transitions.
5. Review Supabase Data API exposure, Storage, Edge Functions, OAuth callbacks, backup/retention and rate limits.
6. Implement trusted server-side organization onboarding, audit writes and OAuth callbacks. The first owner membership must be created in the same transaction as the organization.
7. Keep the service-role key exclusively on the server.

The JSONB guard catches known credential-like key names; it cannot detect secrets hidden in arbitrary text, encoded values or unrecognized keys. Never store provider credentials in database rows.

## Deployment status

**NOT DEPLOYED / NOT PRODUCTION-VERIFIED.** No Supabase project was created or modified, and no customer data was used. The application continues to use its demo/local persistence until backend integration is separately implemented and approved.
