/*
Deletes cities not present in src/constants/italianCities.ts.
Safety: requires CONFIRM=true env var.
*/
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {}

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

async function main() {
  if (String(process.env.CONFIRM).toLowerCase() !== 'true') {
    console.error('Refusing to delete: set CONFIRM=true to proceed.');
    process.exit(1);
  }

  const prismaPath = path.join(__dirname, '..', 'src', 'generated', 'prisma');
  const { PrismaClient } = require(prismaPath);
  const prisma = new PrismaClient();

  try {
    console.log('Using DATABASE_URL:', maskUrl(process.env.DATABASE_URL));
    const [{ count: before }] = await prisma.$queryRawUnsafe(
      'SELECT count(*)::int AS count FROM public.cities'
    );

    const list = loadCitiesFromTs();
    const slugs = list.map(
      (c) =>
        c.slug ||
        (c.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
    );

    const del = await prisma.city.deleteMany({ where: { slug: { notIn: slugs } } });
    const [{ count: after }] = await prisma.$queryRawUnsafe(
      'SELECT count(*)::int AS count FROM public.cities'
    );

    console.log(`Deleted ${del.count} extra rows. Count before=${before}, after=${after}.`);
  } catch (e) {
    console.error('Cleanup failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
