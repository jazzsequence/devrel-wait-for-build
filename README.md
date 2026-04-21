# devrel-wait-for-build

Fixture site for the [`jazzsequence/pantheon-wait-for-build`](https://github.com/jazzsequence/pantheon-wait-for-build) GitHub Action. Pushes to this repo trigger a Pantheon Next.js build; the action waits for that build to complete and then flushes the edge cache — exercising the full loop end-to-end.

The site displays blog posts pulled from [jazzsequence.com](https://jazzsequence.com) via the WordPress REST API.

## Stack

- **Next.js 16** (Turbopack, App Router, `cacheComponents`)
- **React 19**, TypeScript 5, Tailwind CSS 4
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

### Caching

`cacheComponents: true` enables Next.js 16's Cache Components API. Data-fetching functions use the `'use cache'` directive with named `cacheLife` profiles (`blog`: 5m revalidate / 1h expire). Dynamic post pages use Partial Prerender — static shell with `<Suspense>`-streamed content.

### CI/CD

On every push to `main`, `.github/workflows/cache-flush.yml` runs `jazzsequence/pantheon-wait-for-build@main`, which:

1. Authenticates with Pantheon using `TERMINUS_TOKEN`
2. Polls until the build for the pushed commit reaches a terminal state
3. Flushes the GCDN edge cache on success

Dependabot keeps npm and GitHub Actions dependencies updated weekly.

## Pantheon

- **Site:** `devrel-wait-for-build`
- **Active env:** `dev` (test/live unused — fixture only)
- **Required secret:** `TERMINUS_TOKEN` in GitHub repository settings
