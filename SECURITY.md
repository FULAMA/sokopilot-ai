# Security Policy — SOKOPILOT AI

## Reporting a vulnerability

Do not publish exploit details, customer data, access tokens, API keys, passwords, refresh tokens, or database credentials in public issues.

For a suspected vulnerability, contact the repository owner privately through GitHub's private vulnerability reporting feature (Security tab → Report a vulnerability), when available. Include:
- affected component and commit;
- impact and prerequisites;
- reproducible steps using synthetic data;
- suggested mitigation, if known.

Allow reasonable time for triage and remediation before public disclosure.

## Repository rules

- This repository is public by design. Only source code, synthetic fixtures, documentation, and non-sensitive examples may be committed.
- Never commit `.env`, production configuration, credentials, OAuth tokens, private keys, database URLs containing passwords, customer exports, or real contact lists.
- Keep `.env.example` limited to placeholder values.
- Revoke and rotate any secret accidentally committed; deleting it from the latest commit is not sufficient because Git history may retain it.
- Never expose Supabase service-role or secret API keys in frontend bundles.
- Require review and automated checks before merging changes to the default branch.
- Use least-privilege GitHub and provider permissions; enable MFA on maintainer accounts.
- Report suspected exposure immediately and preserve relevant audit evidence without copying secrets into issues.
