import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './db';
import logger from '../logger';

const MIGRATIONS_DIR = join(__dirname, '../../migrations');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         SERIAL       PRIMARY KEY,
      filename   TEXT         NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  const { rows: applied } = await pool.query<{ filename: string }>(
    `SELECT filename FROM _migrations ORDER BY filename`
  );
  const appliedSet = new Set(applied.map((r) => r.filename));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (process.argv.includes('--status')) {
    console.log('\nMigration status:');
    for (const f of files) {
      console.log(`  ${appliedSet.has(f) ? '✓' : '✗'} ${f}`);
    }
    console.log();
    return;
  }

  const pending = files.filter((f) => !appliedSet.has(f));

  if (pending.length === 0) {
    logger.info('All migrations are up to date — nothing to apply.');
    return;
  }

  logger.info({ count: pending.length }, 'Applying pending migrations');

  for (const file of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    logger.info({ file }, 'Applying migration');
    await pool.query(sql);
    await pool.query(`INSERT INTO _migrations (filename) VALUES ($1)`, [file]);
    logger.info({ file }, 'Migration applied');
  }

  logger.info('All migrations complete.');
}

migrate()
  .catch((err) => {
    logger.error({ err }, 'Migration runner failed');
    process.exit(1);
  })
  .finally(() => pool.end());
