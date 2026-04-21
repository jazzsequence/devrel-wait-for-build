# devrel-wait-for-build

Fixture site for the [`jazzsequence/pantheon-wait-for-build`](https://github.com/jazzsequence/pantheon-wait-for-build) GitHub Action. Pushes to this repo trigger a Pantheon Next.js build; the action waits for that build to complete and then flushes the edge cache — exercising the full loop end-to-end.

The site displays blog posts pulled from [jazzsequence.com](https://jazzsequence.com) via the WordPress REST API.

## Stack

- **Next.js 16** (Turbopack, App Router, `cacheComponents`)
- **React 19**, TypeScript 6
- **`@pantheon-systems/pds-toolkit-react`** — [Pantheon Design System](https://pds-react.pantheon.io/) components and CSS utilities
- **`@pantheon-systems/nextjs-cache-handler`** for ISR + `'use cache'` on Pantheon
- **Zod** for runtime validation of WordPress REST API responses

## Local development

```bash
npm install
npm run dev
```

No `.env` needed — the WordPress API is public.

## How it works

### WordPress REST API

Posts are fetched from `https://jazzsequence.com/wp-json/wp/v2`. The client in `lib/wordpress/client.ts` adds rate limiting, exponential backoff retry, and Zod validation. Images are served from DigitalOcean Spaces (`sfo2.digitaloceanspaces.com`).

### Design system

UI uses [`@pantheon-systems/pds-toolkit-react`](https://pds-react.pantheon.io/) — Pantheon's React component library. `pds-core.css` is imported at the root for design tokens, fonts, and utility classes. Components (`Card`, `CardHeading`, `SiteFooter`, `PantheonLogo`) are used throughout.

PDS is a client-only library (React context is created at module initialization), so all PDS component imports must be in `'use client'` components. Client components that call `new Date()` at render time also require a `<Suspense>` boundary per Next.js 16's prerender rules.

### Caching

`cacheComponents: true` enables Next.js 16's Cache Components API. Data-fetching functions use the `'use cache'` directive with named `cacheLife` profiles (`blog`: 5m revalidate / 1h expire). Dynamic post pages use Partial Prerender — static shell with `<Suspense>`-streamed content.

### CI/CD

On every push to `main` or pull request, `.github/workflows/cache-flush.yml` runs `jazzsequence/pantheon-wait-for-build@main`, which:

1. Authenticates with Pantheon using `TERMINUS_TOKEN`
2. Polls until the build for the pushed commit reaches a terminal state
3. Flushes the GCDN edge cache on success

Dependabot keeps npm and GitHub Actions dependencies updated weekly. `TERMINUS_TOKEN` must be added to both repository and Dependabot secret stores so PR pipelines can authenticate.

## Pantheon

- **Site:** `devrel-wait-for-build`
- **Active env:** `dev` (test/live unused — fixture only)
- **Required secret:** `TERMINUS_TOKEN` in GitHub repository settings **and** Dependabot secrets
