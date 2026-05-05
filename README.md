# Casa de Asterión CMS

Admin interface for Casa de Asterión editorial. Astro SSR with Google OAuth via Supabase.

## Sister repo

Public site, DB schema, edge functions:
https://github.com/sebastian-ardila/casadeasterion-2026

## Local dev

```bash
pnpm install
cp .env.example .env  # fill in values
pnpm dev               # http://localhost:4322
```

## Deploy

**AWS Amplify Hosting** (platform `WEB_COMPUTE`). Connected to GitHub. Env vars (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_CMS_URL`) set in Amplify Console.

See `CLAUDE.md` for architecture notes and how to keep DB types in sync with the sister repo.
