/*
Diagnostics for DB connection and cities row count.
Prints masked DATABASE_URL, current database/schema, and counts/slugs.
*/
const path = require('path');

function maskUrl(url) {
  if (!url) return 'undefined';
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    if (u.username) u.username = '***';
    return u.toString();
  } catch {
    return url.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
  }
}

async function main() {
  const prismaPath = path.join(__dirname, '..', 'src', 'generated', 'prisma');
  const { PrismaClient } = require(prismaPath);
  const prisma = new PrismaClient();
  try {
    const masked = maskUrl(process.env.DATABASE_URL);
    console.log('DATABASE_URL:', masked);

    const info = await prisma.$queryRawUnsafe(
      'SELECT current_database() as db, current_schema() as schema, inet_server_addr() as host, version() as version'
    );
    console.log('DB info:', info);

    const [{ count }] = await prisma.$queryRawUnsafe(
      'SELECT count(*)::int AS count FROM public.cities'
    );
    console.log('public.cities count =', count);

    const sample = await prisma.$queryRawUnsafe(
      'SELECT id, slug, name FROM public.cities ORDER BY id DESC LIMIT 10'
    );
    console.log('Sample last 10 rows:', sample);
  } catch (e) {
    console.error('Diagnostics failed:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
