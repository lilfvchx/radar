import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Initialize connection pool
// For Neon or Vercel Postgres, DATABASE_URL should be defined in the environment.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

/**
 * Executes a query with error handling.
 */
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

/**
 * Initializes the database schema using the schema.sql file.
 * We'll ensure this is safe to run repeatedly (e.g. IF NOT EXISTS).
 */
export async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Skipping DB initialization.');
    return;
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await query(schemaSql);
    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database schema:', err);
    throw err; // Fail fast if schema cannot be created
  }
}

export default pool;
