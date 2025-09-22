/*
Seeds the `cities` table using data from src/constants/italianCities.ts via Prisma Client.
- Upserts by slug
- Uses all provided fields (region, province, provinceCode, lat, lng, altNames, isActive, sortOrder)

Env options:
  LIMIT=<n>        Limit number of cities (for quick tests)
  BATCH_SIZE=<n>   Batch size (default 50)
*/

const path = require('path');
// Ensure .env is loaded for DATABASE_URL
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {}

function maskUrl(url) {
  if (!url) return 'undefined';
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    if (u.username) u.username = '***';
    return u.toString();
  } catch {
    return String(url).replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
  }
}

function loadCitiesFromTs() {
  const filePath = path.join(__dirname, '..', 'src', 'constants', 'italianCities.ts');
  let content = require('fs').readFileSync(filePath, 'utf8');
  content = content.replace(/export\s+const\s+italianCities\s*:[^=]*=/, 'module.exports =');
  const loader = new Function('module', 'exports', content + '\n;return module.exports;');
  const moduleObj = { exports: {} };
  const result = loader(moduleObj, moduleObj.exports);
  if (!Array.isArray(result)) throw new Error('italianCities TS did not load as an array');
  return result;
}

function toNullableDecimal(v) {
  if (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) return null;
  const n = Number(v);
  return n.toFixed(6); // pass as string to Prisma for Decimal(9,6)
}

async function main() {
  const cities = loadCitiesFromTs();
  const limit = process.env.LIMIT ? Number(process.env.LIMIT) : null;
  const batchSize = process.env.BATCH_SIZE ? Math.max(1, Number(process.env.BATCH_SIZE)) : 50;

  // Load Prisma Client from generated output path configured in prisma/schema.prisma
  const prismaPath = path.join(__dirname, '..', 'src', 'generated', 'prisma');
  const { PrismaClient } = require(prismaPath);
  const prisma = new PrismaClient();

  try {
    const all = limit ? cities.slice(0, limit) : cities;

    // Connection diagnostics
    console.log('Using DATABASE_URL:', maskUrl(process.env.DATABASE_URL));
    const [{ db, schema }] = await prisma.$queryRawUnsafe(
      'SELECT current_database() as db, current_schema() as schema'
    );
    const [{ inet_server_addr }] = await prisma.$queryRawUnsafe('SELECT inet_server_addr()::text');
    const [{ version }] = await prisma.$queryRawUnsafe('SELECT version()');
    console.log('DB diagnostics:');
    console.log(`  database: ${db}`);
    console.log(`  schema:   ${schema}`);
    console.log(`  host:     ${inet_server_addr}`);
    console.log(`  version:  ${version.split('\n')[0]}`);
    console.log(`Input cities: ${cities.length}; processing: ${all.length}`);

    console.log(`Seeding ${all.length} cities in batches of ${batchSize}...`);

    for (let i = 0; i < all.length; i += batchSize) {
      const chunk = all.slice(i, i + batchSize);
      await prisma.$transaction(
        chunk.map((c) =>
          prisma.city.upsert({
            where: {
              slug:
                c.slug ||
                (c.name || '')
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, ''),
            },
            create: {
              name: c.name,
              slug: c.slug,
              region: c.region ?? null,
              province: c.province ?? null,
              provinceCode: c.provinceCode ?? null,
              lat: toNullableDecimal(c.lat),
              lng: toNullableDecimal(c.lng),
              altNames: Array.isArray(c.altNames) ? c.altNames : [],
              isActive: typeof c.isActive === 'boolean' ? c.isActive : true,
              sortOrder: c.sortOrder ?? c.id ?? null,
            },
            update: {
              name: c.name,
              region: c.region ?? null,
              province: c.province ?? null,
              provinceCode: c.provinceCode ?? null,
              lat: toNullableDecimal(c.lat),
              lng: toNullableDecimal(c.lng),
              altNames: Array.isArray(c.altNames) ? c.altNames : [],
              isActive: typeof c.isActive === 'boolean' ? c.isActive : true,
              sortOrder: c.sortOrder ?? c.id ?? null,
              updatedAt: new Date(),
            },
          })
        )
      );
      console.log(`  Upserted ${Math.min(i + batchSize, all.length)} / ${all.length}`);
    }

    console.log('Seeding complete.');

    // Post-seed verification
    const slugs = (limit ? cities.slice(0, limit) : cities).map(
      (c) =>
        c.slug ||
        (c.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
    );
    const dbRows = await prisma.city.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true },
    });
    const present = new Set(dbRows.map((r) => r.slug));
    const missing = slugs.filter((s) => !present.has(s));
    const totalInDb = await prisma.city.count();

    console.log(`Verification: ${dbRows.length}/${slugs.length} expected slugs present.`);
    if (missing.length) {
      console.warn(
        `Missing ${missing.length} cities from input list:`,
        missing.slice(0, 20).join(', ') + (missing.length > 20 ? ' ...' : '')
      );
    }
    console.log(`Total cities in DB: ${totalInDb}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
