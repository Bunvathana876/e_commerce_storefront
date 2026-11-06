# Storefront deployment

This Storefront is a personal, non-commercial student demonstration on Vercel
Hobby. The backend, database, and Management Dashboard are managed separately.

## Vercel configuration

- Repository: `https://github.com/Bunvathana876/e_commerce_storefront.git`
- Production branch: `main`
- Framework: Next.js (native deployment; no Docker or static export)
- Root directory: repository root
- Node.js: 24.x
- Install command: `npm ci` (include development dependencies for build tooling)
- Build command: `npm run build`
- Output directory: framework default
- Plan: existing Hobby account; no paid services are required

Set these public configuration variables for Production and Preview **before
building**:

```dotenv
NEXT_PUBLIC_API_URL=https://blue-panda-api-demo.onrender.com/api
NEXT_PUBLIC_ENABLE_DEMO_COUPONS=false
```

`NEXT_PUBLIC_MANAGEMENT_URL` is pending until the Management Dashboard is
deployed. Leave it unset for now. Existing management/seller links fall back to
`http://localhost:3001`; they are not usable remotely until this value is set to
the deployed dashboard HTTPS origin and the Storefront is rebuilt. Customer
shopping does not require the dashboard.

Never upload `.env.local` or configure database credentials, JWT signing secrets,
or backend private keys in this frontend. `NEXT_PUBLIC_*` values are public and
compiled into browser JavaScript. `.vercelignore` excludes local environment
files and Dockerfiles. Do not pull Vercel environments over an existing local
environment file.

## Security changes

Next.js and `eslint-config-next` are pinned together at `16.4.5`, verified against
the npm registry and the [official security release](https://github.com/vercel/next.js/releases/tag/v16.4.5).

`@svgr/webpack@8.1.0` brought an unpatched `deepmerge@4.3.1` dependency through
`@svgr/plugin-svgo`. The loader now uses the same SVGR 8 core and JSX transform,
followed by Babel's JSX transform, without that chain. SVG imports remain React
components; optional SVGO minification is omitted, preserving source geometry
and IDs. Build-only dependencies live in `devDependencies`.

A scoped override moves only TypeScript ESLint's `minimatch` from vulnerable
10.x to patched 11.x. This is a deliberate transitive major update: its consumed
`Minimatch`/`minimatch` APIs are retained; unit tests and lint validate the change.
Other ESLint users of minimatch 3.x are outside the advisory's affected range and
are unchanged. Remove the override when TypeScript ESLint adopts a patched range.

Security headers and the explicit image host allowlist in `next.config.ts` are
retained. No wildcard hostname is allowed.

## Release checks

```sh
npm ci
npm audit --omit=dev
npm audit
NEXT_PUBLIC_API_URL=https://blue-panda-api-demo.onrender.com/api NEXT_PUBLIC_ENABLE_DEMO_COUPONS=false NEXT_PUBLIC_MANAGEMENT_URL= npm run build
npm test
npm run lint
```

Verify Home, Shop, a real Product Details page, Login, Register, Cart, Checkout,
Orders, and Account in the production build. Protected pages should require
authentication. Do not treat an HTTP 200 page shell as proof that backend data
loaded. Do not place orders or claim paid status to simulate success.

The existing `Dockerfile` runs development mode. The separately prepared
`Dockerfile.prod` is not used by Vercel and remains outside this release; its
Node 20 base and localhost build defaults need separate review before container
deployment.

## Render CORS after deployment

After Vercel assigns the production URL, copy its **origin** (scheme and hostname,
no trailing slash or path), for example `https://your-project.vercel.app`.

In Render, open the existing Blue Panda API service → Environment →
`CORS_ORIGINS`. Preserve its existing origins and append the exact Storefront
origin using the format already used by that setting. Save and redeploy the API.
The Storefront release does not authorize changing the backend configuration.
Add any preview/custom origin separately only if that origin should access the
API; do not allow every `*.vercel.app` origin.

Check a browser request to `/api/products` and its OPTIONS preflight. The
response must contain `Access-Control-Allow-Origin` matching the exact
Storefront origin, and permit `GET`, `POST`, `Content-Type`, and `Authorization`
as needed. Recheck catalog loading and authentication after CORS is configured.
Render cold starts or backend failures must be reported as failures rather than
replaced with fabricated orders or payments.

## Local verification (2026-11-06)

- `npm ci`: passed, lockfile installation reproduced successfully.
- `npm audit --omit=dev` and `npm audit`: zero vulnerabilities.
- Production build with the Render API and demo coupons disabled: passed.
- `npm test`: 31 passed, including SVG rendering, invalid input, and a real
  Webpack bundle using the ESM loader.
- `npm run lint`: passed, zero errors; one warning in the existing
  `src/lib/api.ts:204` navigation code. Existing unit tests also emit Node module
  type and unavailable browser storage warnings.
- Production HTTP smoke checks: `/`, `/shop`, `/product/1`, `/login`, `/register`,
  `/cart`, `/checkout`, `/orders`, `/account` all returned 200 and the expected
  security headers. These checks validate page responses, not authenticated
  browser interactions.
- Browser automation was unavailable (browser host unavailable; native Safari
  access timed out). Catalog, authentication, and cart interactions still need
  browser verification.
- A read-only request to the Render API's `/api/products?limit=1` returned 200
  with `success: true` and an empty `items` array. A real product detail or order
  journey could not be verified. No accounts, orders, or payments were created.
- `.env.local` was preserved. No backend or database changes were made.
