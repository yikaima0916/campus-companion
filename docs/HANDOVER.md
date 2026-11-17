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

## Completed after migration (2026-11-17)

- `MS_CLIENT_SECRET` set by the owner; the new redirect URI was added to the Microsoft Entra app `eeb24f96-510a-48e0-a792-0b81333703d5` (managed by xrforzsyx@outlook.com). Signed-in status reports Outlook configured.
- The interface opens in English for new visitors, including browsers set to Chinese.
- The original address `https://campus-companion.campus-companion.workers.dev` (Yikamai0916@gmail.com's Account) now runs `redirect/worker.js` (`wrangler.redirect.jsonc`): a 301 to the new address with no AI and no cron. Its D1 database `campus-companion` (`d4251b8d-…`) and earlier Worker versions are kept as a backup.
- Workers AI: this Worker has no app-level cap; it uses this account's Cloudflare allocation (10,000 neurons per day on Workers Free).
