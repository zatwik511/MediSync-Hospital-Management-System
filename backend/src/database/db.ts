import { Pool, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Prevent pg from converting date columns into JS Date objects.
// Without this, a DB date of "2026-05-23" becomes midnight local time,
// which serialises to "2026-05-22T18:30:00.000Z" in IST and breaks date comparisons.
types.setTypeParser(1082, (val: string) => val);

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL in .env file');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
