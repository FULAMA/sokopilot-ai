# PostgreSQL security regression tests

Run against a disposable local PostgreSQL/Supabase database only.

1. Bootstrap the test-only Auth shim:
   `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/bootstrap_auth_mock.sql`
2. Apply `supabase/migrations/0001_initial_schema.sql`.
3. Apply `supabase/migrations/0002_tenant_security_hardening.sql`.
4. Run `supabase/tests/verify_schema.sql`.
5. Run `supabase/tests/tenant_isolation.sql`.

The GitHub Actions workflow `.github/workflows/database.yml` runs this sequence on PostgreSQL 16. The Auth shim is intentionally limited to the claims and user table needed by these migrations; it does not emulate Supabase Auth behavior or replace local Supabase testing.

The tenant test rolls back its fixtures. Never point these commands at a production or shared database.
