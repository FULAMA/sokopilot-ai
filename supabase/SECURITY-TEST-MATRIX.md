# Database security test matrix

| Control | Implementation | Automated evidence |
|---|---|---|
| Tenant row visibility | RLS policies and membership helpers | Tenant A cannot read Tenant B leads |
| Cross-tenant update | RLS + immutable `org_id` trigger | Cross-tenant update affects zero rows; reassignment trigger rejects direct change |
| Membership escalation | Membership RLS policy | Sales role cannot promote itself |
| Last active owner | Deferred constraint trigger + organization row lock | Sole owner cannot demote itself |
| Integration credential keys | Recursive JSONB check constraint | Nested `access_token` key rejected |
| Automation credential keys | Recursive JSONB check constraint | Nested `client_secret` key rejected |
| Campaign approval | Immutable approval actor/time and approved content | Approved campaign content update rejected |
| Automation approval | Immutable approval actor/time and configuration | Approved automation configuration update rejected |
| Audit retention | Append-only trigger and restrictive organization FK | Structural verification checks trigger and FK |
| Trusted backend writes | Explicit `service_role` table/sequence grants | Structural verification checks audit INSERT privilege |

## Limits

The suite is a regression baseline, not a complete penetration test. Add table-by-table role tests, cross-tenant INSERT attempts, membership removal tests, concurrent owner-removal tests, audit mutation tests and actual Supabase Auth/Storage/Edge Function tests before production.

The CI job uses PostgreSQL 16 plus a minimal Auth compatibility shim. It validates PostgreSQL DDL, triggers and RLS policies; it does not emulate the full Supabase platform.
