# Monetizely Take-Home: Quoting Tool

A lightweight quoting application that lets an analyst:

1. Set up a SaaS product catalog (products → tiers → features).
2. Mark each feature per tier as included / add-on / unavailable.
3. Configure add-on pricing (fixed monthly, per-seat, or percent-of-product).
4. Build a quote with seats + term + optional quote-level discount.
5. Save a shareable, read-only quote URL showing transparent line-item math.

## Tech

- Next.js (App Router) + TypeScript
- Postgres + Drizzle ORM
- Unit tests: Vitest (pricing math)
- E2E: Playwright (catalog → quote → share URL)

## Running locally

### 1) Install deps

```bash
cd /Users/vedicmeet-himanshu/Downloads/hiring_task/app
npm install
```

### 2) Configure database

Create `.env` in the `app` folder (copy from `.env.example`). For a **local** Postgres, use something like:

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:5432/monetizely"
```

Create the database once (`createdb monetizely` or via your GUI). Adjust user, password, host, and database name to match your install. For hosted DBs, use your provider’s URL (often with `?sslmode=require`).

### 3) Run migrations

```bash
npm run db:generate
npm run db:migrate
```

### 4) Start the app

```bash
npm run dev
```

Open http://localhost:3000

## Tests

### Unit tests (pricing)

```bash
npm test
```

### E2E (Playwright)

Install browser once:

```bash
npx playwright install --with-deps chromium
```

Run:

```bash
npm run e2e
```

## Deploying to Vercel

- Provision a Postgres database (Neon or Vercel Postgres).
- Set `DATABASE_URL` in Vercel Project → Settings → Environment Variables.
- Run migrations as part of your release process. The simplest approach is to run `npm run db:migrate` once against the production database after the first deployment (and on each schema change).

## Assumptions / decisions

- Term discounts (15% annual, 25% two-year) apply to the **base product per-seat price**. Add-ons are priced independently, matching the structure in `reference/sample-quote.xlsx`.
- Per-seat add-ons have an independent seat count (they do not have to match the product seat count).
- Percent-of-product add-ons are computed as a percentage of the product line-item amount.
- Quote-level discounts apply to the subtotal after all line items.
- Quotes store a snapshot of their computed breakdown so share links remain stable even if the catalog changes later.

## Questions I would ask

- Should term discounts also apply to per-seat add-ons, or only the base product subscription?
- For percent-of-product add-ons: percent of the discounted product total, or percent of undiscounted list price?
- Should add-ons be allowed to be “included” in some tiers and “add-on” in others (currently yes, per spec)?

## If I had more time

- Better UX for the feature matrix (bulk edits, clearer validation).
- Prevent inconsistent add-on pricing (e.g. missing price fields for the chosen model).
- Better seeding / fixtures for deterministic E2E and demo environments.
- Quote “valid until” field and print-friendly layout.
