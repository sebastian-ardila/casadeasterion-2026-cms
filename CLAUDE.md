# Casa de Asterión CMS — Notes for future sessions

This is the **admin** repo. The public site lives in a sister repo. Both share one Supabase project as backend. Both deploy to AWS Amplify.

## Sister repo

https://github.com/sebastian-ardila/casadeasterion-2026

Local clone (typical setup):
- `~/Docs/Code/casadeasterion-2026-cms/` ← this repo
- `~/Docs/Code/casadeasterion-2026/` ← sister repo

## Architecture

```
┌─ this repo (CMS, SSR Astro) ──writes──┐
│                                       │
│                                  Supabase Postgres
│                                       │
│  Sister repo (public, SSG Astro)──reads at build time──┘
└─ Auth: Google OAuth via Supabase
```

**Key invariant**: this CMS is the **only** writer to content tables (`books`, `posts`, `authors`, `categories`, `site_configuration`). When it writes, DB triggers in the sister repo's migrations fire `pg_net.http_post` to an Amplify Build Hook, rebuilding the public site.

## Stack

- Astro 5 SSR with `@astrojs/node` adapter in `standalone` mode (`output: "server"`)
- `@supabase/ssr` for cookie-based auth
- Tailwind 4
- Markdown editor with live preview (marked.js)
- Deployed to AWS Amplify Hosting with **`platform: WEB_COMPUTE`**

> **Why Amplify and not Vercel?** Keeping the entire stack on AWS (DNS in Route 53, public site on Amplify already, IAM/billing unified). Amplify Hosting *does* support Astro SSR — but only when the app's `platform` is `WEB_COMPUTE`. New Amplify apps default to `WEB` (static-only) and the console UI does not expose the toggle. The fix is a one-time CLI command:
>
> ```bash
> aws amplify update-app --app-id dq9ezrf6xwgei --platform WEB_COMPUTE
> ```
>
> After that, Amplify auto-detects Astro's `dist/server/entry.mjs` and deploys it as a Lambda, while `dist/client/` is served from S3+CloudFront.

## Database types — KEEP IN SYNC

`src/types/database.types.ts` is **a copy** of the sister repo's `supabase/types/database.types.ts`.

When the DB schema changes (in the sister repo via Supabase MCP `apply_migration`):

1. In sister repo, regenerate types:
   ```
   # Via Supabase MCP in your IDE/Claude Code:
   mcp__plugin_supabase_supabase__generate_typescript_types
   # Save the output to sister repo's supabase/types/database.types.ts
   ```
2. Copy to this repo:
   ```bash
   cp ../casadeasterion-2026/supabase/types/database.types.ts \
      ./src/types/database.types.ts
   ```
3. `pnpm typecheck` to confirm no drift
4. Commit & push **both** repos

If types drift, runtime fails with "column not found" or insert errors get silently rejected by RLS.

## Auth flow

- `/login` — page with Google OAuth button (uses `supabase.auth.signInWithOAuth`)
- `/auth/callback` — exchanges code for session, sets cookies, redirects to `next` or `/`
- `/logout` — POST endpoint, signs out and redirects to `/login`
- `src/middleware.ts` populates `Astro.locals.user` with `{ id, email, role }`
- Pages call `requireAdmin(Astro)` which redirects non-admins to `/login`

**Admin allowlist** lives in `public.admin_emails` table (in the sister repo's migrations). Adding an email there auto-promotes a profile to `role='admin'` via trigger. To grant admin: `INSERT INTO admin_emails (email) VALUES ('foo@bar.com')`.

## What does NOT belong here

- **Cloudflare Turnstile / honeypot / rate-limit** — those guard public forms (newsletter on the public site). The CMS is behind Google OAuth; no anti-bot needed.
- **Public-facing endpoints** — no `subscribe` form, no newsletter. All public stuff lives in the sister repo.
- **Edge functions** — those are deployed in Supabase; their code lives in the sister repo's `supabase/functions/`.

## Deployment

**AWS Amplify Hosting**, app ID `dq9ezrf6xwgei`, region `us-east-1`. Connected to this GitHub repo, deploys on push to `main`.

Required env vars in Amplify Console → App Settings → Environment Variables (or via CLI `aws amplify update-app --environment-variables ...`):
| Key | Value |
|---|---|
| `PUBLIC_SUPABASE_URL` | `https://ebseegzxfrvblpwhpmhr.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | the anon JWT |
| `PUBLIC_CMS_URL` | `https://cms.casadeasterionediciones.com` |

Build spec lives in `amplify.yml` at repo root. The artifacts directory is `dist/` — Amplify (under WEB_COMPUTE) inspects the Astro output structure and routes static assets to S3 while wrapping `dist/server/entry.mjs` in a Lambda.

Custom domain: `cms.casadeasterionediciones.com`. Configured in Amplify Console → Custom domains; Amplify auto-creates Route 53 records since DNS is in the same AWS account.

## Supabase auth — Redirect URLs allowlist

Supabase rejects OAuth callbacks not in its allowlist. Required entries (Dashboard → Auth → URL Configuration → Redirect URLs):
- `http://localhost:4322/**` — local dev
- `https://cms.casadeasterionediciones.com/**` — production
- (Plus the sister repo's public URLs)

If you change the deployed CMS URL, also update the allowlist or login breaks silently.

## Local dev

```bash
pnpm install
cp .env.example .env
# fill in PUBLIC_SUPABASE_ANON_KEY (get it from sister repo's apps/web/.env)
pnpm dev
# http://localhost:4322
```

Sign in with `sebas.dila@gmail.com` (or any email already in `admin_emails`).

## Common gotchas

- **Saving site_configuration via the `/site` page**: uses a single `upsert` with array of rows so only ONE rebuild fires. Never split into multiple individual upserts — that wastes Amplify build minutes.
- **Creating drafts doesn't trigger rebuild** (correctly). Only published content changes affect the public site. See sister repo `0012_smarter_rebuild_triggers.sql`.
- **Astro page form actions**: forms POST to the same route. Handler runs in the page frontmatter. Don't extract to API routes — keeps things colocated.
