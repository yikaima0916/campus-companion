# Campus Companion handover deployment

| Item | Value |
| --- | --- |
| Cloudflare account | Makaii0916@gmail.com's Account (`57a3dca744df61def7f992e93a387707`) |
| Site | https://campus-companion.campus-companion-ln.workers.dev |
| Worker | `campus-companion` |
| D1 database | `campus-companion` (`3d5b6abf-c4fc-4874-854e-a9d012667e24`) |
| Config | `wrangler.handover.jsonc` |
| Cron | every minute (reminders, digests, mail sync) |

Deploy with `npx wrangler deploy --config wrangler.handover.jsonc`.

## Migrated on 2026-11-17

- Source: Cloudflare version `06c0a128` of the original deployment, committed as `d565eea`.
- Database: full SQL export of the original D1, imported unchanged (6 users, 1,099 messages, 29 tasks, 1,823 cache rows; counts verified on both sides).
- Outlook connections were removed from the new database because their tokens were encrypted with the original `TOKEN_KEY`, which cannot be read back. Each user reconnects Outlook once.
- New secrets were generated: `TOKEN_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `SHORTCUT_INGEST_KEY`, `PASSWORD_HASH` (random; the legacy owner fallback is disabled). Existing push subscriptions and any iPhone Shortcut need to be set up again.

## Still to do

1. Microsoft Entra app `eeb24f96-510a-48e0-a792-0b81333703d5`:
   - Certificates & secrets → New client secret, then run `npx wrangler secret put MS_CLIENT_SECRET --config wrangler.handover.jsonc` and paste the value.
   - Authentication → Web → add the redirect URI `https://campus-companion.campus-companion-ln.workers.dev/api/outlook/callback`.
2. Retire the original deployment in the Yikamai0916@gmail.com account after the new site is confirmed.
