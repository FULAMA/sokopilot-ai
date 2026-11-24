# SOKOPILOT backend foundation

## Migration order

1. Apply `migrations/0001_initial_schema.sql`.
2. Apply `migrations/0002_tenant_security_hardening.sql`.

Only apply these migrations to a newly created, dedicated SOKOPILOT Supabase project after explicit approval. Never select or modify an existing Supabase project by assumption.

## Verification

- Run `tests/verify_schema.sql` for structural checks.
- Run `tests/tenant_isolation.sql` against a disposable local Supabase database. It creates fixtures and rolls back the transaction.

Neither script has been executed against PostgreSQL in this environment. Frontend CI success is not database security validation.

## Deployment prerequisites

- Keep the `private` schema unexposed through the Supabase Data API.
- Implement organization onboarding, audit writes and OAuth callbacks in trusted server-side code.
- Create the organization and first active owner membership atomically.
- Keep service-role credentials exclusively on the server.
- Review Data API exposure, Storage, Edge Functions, backups, retention and rate limits separately.
- Run Supabase Security Advisors before onboarding real customer data.

No outbound messaging, payment processing, credential persistence or automatic campaign sending is enabled by these migrations.
