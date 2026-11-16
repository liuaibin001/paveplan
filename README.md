# PavePlan

An asphalt material estimator for US and metric projects. It makes density,
compacted thickness, ton definitions, and extra allowance explicit before users
copy or share an estimate.

- Production: <https://paveplan.otoo.workers.dev>
- Repository: <https://github.com/liuaibin001/paveplan>

## Stack

- React 19 and TanStack Start / Router for the application and server rendering.
- TypeScript, Vite, Tailwind CSS, Base UI primitives, and Lucide icons.
- Cloudflare Workers for hosting and D1 for optional saved project shares.
- Drizzle ORM and SQL migrations for the database.
- Vitest for calculation and server behavior tests.

The calculation kernel lives in `src/lib/calculator.ts`. It is shared by the
interface and server validation; the server does not trust client totals.

The homepage is the canonical asphalt calculator. Its Hero contains the live
measurement form and result panel; density, allowance, output units, and price
are available in the expandable assumptions section. `/asphalt-calculator`
permanently redirects to `/`. Formula explanations, reference tables, and FAQs
are server-rendered below the tool.

## Local development

Use Node.js 24, or a compatible Node.js version satisfying `package.json`.

```sh
npm ci
npm run db:local
npm run dev
```

Open <http://localhost:3000>. Local D1 uses Wrangler's local state; applying the
local migration does not change the production database. No Cloudflare API token
is required for local calculations or local D1 development.

`.env.example` documents the optional deployment credential names. Application
secrets are not required for local development. Keep actual credentials in the
shell, Cloudflare's secret facilities, or the GitHub Actions secret store; never
add them to the repository or a `VITE_` variable.

Useful commands:

| Command               | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Start the application with local Worker bindings  |
| `npm run check`       | Check TypeScript                                  |
| `npm run test`        | Run the test suite once                           |
| `npm run build`       | Build the client and server application           |
| `npm run preview`     | Preview the built application locally             |
| `npm run db:generate` | Generate migrations after a Drizzle schema change |
| `npm run db:local`    | Apply committed migrations to local D1            |
| `npm run db:remote`   | Apply committed migrations to production D1       |
| `npm run cf:typegen`  | Generate Cloudflare binding types                 |
| `npm run deploy`      | Build and deploy the Worker using Wrangler        |

Commit generated migration SQL with the schema change. Review it before applying
it remotely, and keep deployment migrations compatible with the application
version that is still running during the deployment.

## Calculation assumptions

The default example is **100 ft x 20 ft at 3 in compacted thickness**, with an
explicit estimate density of **145 lb/ft^3**, no extra allowance, and no supplied
material price. It produces **36.25 US short tons**. This is a mathematical
example, not a specification for every asphalt mix.

```text
area_ft2 = length_ft * width_ft
volume_ft3 = area_ft2 * compacted_thickness_in / 12
net_US_short_tons = volume_ft3 * density_lb_per_ft3 / 2000
planned_total = net_quantity * (1 + extra_allowance_percent / 100)
material_cost = planned_total_in_selected_ton_unit * price_per_selected_ton_unit
```

- Imperial inputs use feet, square feet, inches, and lb/ft^3.
- Metric inputs use meters, square meters, millimeters, and kg/m^3.
- One US short ton is 2,000 lb; one metric tonne is 1,000 kg. They are not the
  same quantity. Long tons are not an output option.
- Switching input units converts dimensions, known areas, thickness, and density.
  Switching output ton units also converts an entered unit price so the material
  cost keeps the same physical basis.
- Areas have independent thicknesses and must not overlap. The project supports
  up to 20 areas and validates finite, positive active measurements.
- Extra allowance is added once to the net material quantity. It is a user
  assumption, not a universal waste or compaction recommendation.
- Intermediate calculations keep their precision; rounding is for display.
  Decimal thicknesses such as 3.5 in must not be truncated.
- An absent price gives no material cost, while an explicitly entered price of
  zero remains a valid zero-price calculation. Material cost excludes labor,
  base, removal, delivery, equipment, and taxes.

The tool estimates hot-mix asphalt from the disclosed inputs. Asphalt millings,
loose recycled material, aggregate base, and liquid binder need their own
material and density assumptions. Confirm the actual mix density and order
quantity with a supplier. The estimator does not determine pavement design or
replace local requirements.

Reference checks include:

| Inputs                            | Expected result                 |
| --------------------------------- | ------------------------------- |
| Default example                   | 36.25 US short tons net         |
| Default with 5% extra allowance   | 38.0625 US short tons total     |
| Default with 10% extra allowance  | 39.875 US short tons total      |
| Default dimensions at 3.5 in      | 42.2916666667 US short tons net |
| 10 m x 10 m x 50 mm, 2,400 kg/m^3 | 5 m^3 and 12 metric tonnes net  |

## Saved shares and privacy

Ordinary calculations do not need a saved share. Creating a share is optional and
sends the project measurements, area names, selected assumptions, and optional
unit price to the server for validation and storage in D1.

Shared links are intended for material estimate collaboration, not confidential
project records. Anyone who has a valid link can read that estimate. Do not put
names, street addresses, contact details, or other sensitive information in area
labels. A hard-to-guess URL and `noindex` are not authentication.

Shares expire after **30 days** and must stop being readable after expiry. Storage
cleanup can happen separately; expiry is not a promise of immediate physical
deletion from every database backup. Saved-share responses and pages should not
be indexed or publicly cached. Do not introduce analytics that collect complete
share URLs, raw measurements, or private labels.

If authentication, analytics, retention, share expiry, or data collection changes,
update the implementation and public privacy information together.

The saved-share API uses these routes:

| Request                                              | Result                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `POST /api/projects` with a `ProjectInput` JSON body | `201` with `id`, `deleteToken`, and ISO `expiresAt`                            |
| `GET /api/projects/{id}`                             | Validated `project`, `createdAt`, and `expiresAt`; `404` if missing or expired |
| `DELETE /api/projects/{id}` with `X-Delete-Token`    | `204` after an authorized deletion                                             |

Creation and deletion require a same-origin request. Keep the deletion token with
the creator; do not append it to the public share link, analytics, or logs. The
server accepts only the project field allowlist, validates calculations, and
enforces request size and rate limits. The `SHARE_RATE_LIMITER` Worker binding
provides the production rate limit. Expired-record cleanup is a separate database
operation from the read-time expiry check.

## Deployment

The Worker serves <https://paveplan.otoo.workers.dev>. The Wrangler configuration
must bind the intended D1 database as `DB` and identify it as `paveplan-db`. A new
Cloudflare account needs its own database and database ID before remote migration
or deployment; do not reuse another account's identifier.

Authenticate Wrangler locally, or provide `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` through the environment. The token needs permission to
deploy Workers and apply D1 migrations in the selected account.

Before a manual production deployment:

```sh
npm ci
npm run check
npm run test
npm run build
npm run db:remote
npx wrangler deploy
```

The repository workflow, `.github/workflows/deploy.yml`, installs from the lock
file and runs TypeScript checks, tests, and the production build. Pull requests
perform those checks only. A successful push to `main` applies remote D1
migrations and deploys the Worker. A manual workflow run on `main` follows the same
deployment path; a run on another branch only checks the application.

Add these GitHub Actions repository secrets before enabling deployment:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The migration or deployment step fails when credentials are absent. Database
migrations and the Worker deployment are separate operations; a successful SQL
migration does not prove that the new application deployed. After deployment,
verify the public calculator, unit conversion, and optional share creation/read
flow against the production URL.

## Content and search maintenance

Keep indexable public pages, canonical URLs, and the sitemap consistent with the
production origin in `src/lib/site.ts`. Important definitions, formulas, examples,
and sources must remain readable in server-rendered HTML. Shared projects need
separate indexing and privacy controls.

Describe real functionality and real reviewers only. Do not fabricate ratings or
engineering credentials for structured data. Update methodology versions and
content dates when the underlying information actually changes. Neither valid
markup, crawler access, nor a deployment guarantees indexing, search rankings,
or AI citations.
