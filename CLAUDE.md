# CLAUDE.md — devrel-wait-for-build

## What this is

Fixture site for the [`jazzsequence/pantheon-wait-for-build`](https://github.com/jazzsequence/pantheon-wait-for-build) GitHub Action. It exists to give that action a real Pantheon Next.js site to push to, wait on, and cache-flush against — exercising the full loop in a production-like environment.

The site itself pulls blog posts from jazzsequence.com via the WordPress REST API.

## Tech stack

- **Next.js 16** with Turbopack and App Router
- **React 19**, TypeScript 5, Tailwind CSS 4
- **`@pantheon-systems/nextjs-cache-handler`** — dual handler setup:
  - `cacheHandler.ts` → ISR and fetch cache (legacy)
  - `use-cache-handler.ts` → `'use cache'` directive (Next.js 16)
- **Zod** for WordPress REST API response validation
- **date-fns** for date formatting

## Local dev

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npx tsc --noEmit  # type check
```

No `.env` file needed for local dev — the WordPress API is public and image fetching uses the Next.js image optimizer which is configured for the CDN hostname.

## Caching strategy

`cacheComponents: true` in `next.config.ts` enables Next.js 16's Cache Components. Route segment config (`export const revalidate`) is incompatible with this flag — use `'use cache'` + `cacheLife()` instead.

Two named cache life profiles are configured:

| Profile | Stale | Revalidate | Expire |
|---------|-------|-----------|--------|
| `short` | 30s   | 60s        | 5m     |
| `blog`  | 60s   | 5m         | 1h     |

Dynamic routes (e.g. `/posts/[slug]`) use Partial Prerender (PPR): the static shell is prerendered, and `params`-dependent content is streamed inside a `<Suspense>` boundary.

## WordPress API

Source: `https://jazzsequence.com/wp-json/wp/v2`

The client (`lib/wordpress/client.ts`) handles:
- Rate limiting (token bucket, 10 req/s)
- Exponential backoff retry (3 attempts)
- Zod validation on all responses
- ISR/fetch-cache options via `buildISROptions()`

Images are served from DigitalOcean Spaces (`sfo2.digitaloceanspaces.com/cdn.jazzsequence/**`) — `next.config.ts` has the `remotePatterns` entry for this.

## CI/CD

`.github/workflows/cache-flush.yml` triggers on every push to `main`:

1. Invokes `jazzsequence/pantheon-wait-for-build@main`
2. The action authenticates via `TERMINUS_TOKEN`, polls until the Pantheon build for the pushed commit completes, then flushes the GCDN edge cache

**Required GitHub secret:** `TERMINUS_TOKEN` — a Pantheon machine token with access to the `devrel-wait-for-build` site.

Dependabot keeps npm and GitHub Actions dependencies updated weekly.

## Pantheon environment

- **Site:** `devrel-wait-for-build`
- **Active environment:** `dev` (test/live intentionally unused — fixture site only)
- **Domain:** `dev-devrel-wait-for-build.pantheonsite.io`
