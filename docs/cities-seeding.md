# Cities seeding: how to update the database

This guide explains how to update the `cities` table whenever you edit `src/constants/italianCities.ts`.

## Prerequisites

- DATABASE_URL configured in `.env` (Neon Postgres or your DB)
- Prisma client generated (will auto-generate on first query)
- Node 18+

## What the scripts do

- `scripts/seed-cities.js` reads `src/constants/italianCities.ts` and upserts rows into `public.cities` by `slug`.
  - Sets/updates: `name, slug, region, province, provinceCode, lat, lng, altNames, isActive, sortOrder`
  - Updates `updatedAt` on existing rows
  - Verifies the count vs. your file
- `scripts/seed-cities-all.js` runs the same seeding but always processes ALL cities (ignores LIMIT env var)
- `scripts/clean-cities.js` deletes rows not present in `italianCities.ts` (safety: requires `CONFIRM=true`)

## Common commands

Seed ALL cities (recommended):

```powershell
npm run -s seed:cities:all
```

Seed a subset (quick test):

```powershell
$env:LIMIT=10; npm run -s seed:cities
```

Clean extra rows (make DB match the file exactly):

```powershell
$env:CONFIRM='true'; npm run -s clean:cities
```

Open Prisma Studio to inspect:

```powershell
npx prisma studio
```

## Verifying the correct database

Each run prints diagnostics, including the masked `DATABASE_URL` and DB info. Ensure the Neon branch/DB you check in the console matches this.

Example output:

```
Using DATABASE_URL: postgresql://***:***@<your-neon-host>/<db>?sslmode=require
DB diagnostics:
  database: neondb
  schema:   public
  host:     <host or ::1/128>
  version:  PostgreSQL 17.x ...
```

## After editing `italianCities.ts`

1. Commit your changes to `src/constants/italianCities.ts`
2. Seed all cities:
   ```powershell
   npm run -s seed:cities:all
   ```
3. (Optional) Clean extras to match the file exactly:
   ```powershell
   $env:CONFIRM='true'; npm run -s clean:cities
   ```
4. Inspect with Prisma Studio (optional):
   ```powershell
   npx prisma studio
   ```

## Troubleshooting

- Only a subset appears in Neon console:
  - You might be viewing a different branch/DB. Compare the printed `DATABASE_URL` with the one in Neon Console.
- Type or schema errors:
  - Ensure Prisma migrations are applied and your `City` model matches the DB.
- Coordinates/decimals:
  - `lat`/`lng` are stored in `Decimal(9,6)`. Leave null or provide numeric values; the seeder handles formatting.

## Safety notes

- `clean-cities.js` will delete rows not present in your `italianCities.ts`. It requires `$env:CONFIRM='true'` to prevent accidental deletions.
- Seeding is idempotent via upsert on `slug`.
