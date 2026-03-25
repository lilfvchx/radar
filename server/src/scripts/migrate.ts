import { initDb } from '../core/db/postgres';

async function main() {
  console.log('Running database migrations...');
  try {
    await initDb();
    console.log('Migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
