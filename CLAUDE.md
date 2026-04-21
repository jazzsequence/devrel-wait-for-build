# CLAUDE.md — devrel-wait-for-build

## What this is

Fixture site for the [`jazzsequence/pantheon-wait-for-build`](https://github.com/jazzsequence/pantheon-wait-for-build) GitHub Action. It exists to give that action a real Pantheon Next.js site to push to, wait on, and cache-flush against — exercising the full loop in a production-like environment.

The site itself pulls blog posts from jazzsequence.com via the WordPress REST API.

## Tech stack

- **Next.js 16** with Turbopack and App Router
- **React 19**, TypeScript 6
- **`@pantheon-systems/pds-toolkit-react`** — Pantheon Design System components and CSS utilities
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

## Design system

UI uses `@pantheon-systems/pds-toolkit-react`. Two rules that aren't obvious:

1. **Client-only** — PDS calls `createContext` at module initialization, which fails in the RSC runtime. Every file that imports a PDS component must have `'use client'` at the top.
2. **Suspense required for `new Date()`** — PDS's `SiteFooter` calls `new Date()` at render time. Next.js 16 with `cacheComponents` requires client components doing this to be wrapped in `<Suspense>`. Both `<SiteHeader>` and `<Footer>` in `app/layout.tsx` are wrapped for this reason.

The PDS `Navbar` component was intentionally excluded — it requires `OverlayContextProvider` as an ancestor, but that provider isn't exported from the public API. Use `SiteHeader` (which uses `PantheonLogo`) instead.

## CI/CD

`.github/workflows/cache-flush.yml` triggers on pushes to `main` and on pull requests:

1. Invokes `jazzsequence/pantheon-wait-for-build@main`
2. The action authenticates via `TERMINUS_TOKEN`, polls until the Pantheon build for the pushed commit completes, then flushes the GCDN edge cache
3. For PRs, the environment is auto-detected as `pr-{number}`

**Required secret:** `TERMINUS_TOKEN` must be set in **both** GitHub repository secrets and Dependabot secrets. Without the Dependabot entry, Dependabot PR pipelines will fail to authenticate.

Dependabot keeps npm and GitHub Actions dependencies updated weekly.

## Pantheon environment

- **Site:** `devrel-wait-for-build`
- **Active environment:** `dev` (test/live intentionally unused — fixture site only)
- **Domain:** `dev-devrel-wait-for-build.pantheonsite.io`
