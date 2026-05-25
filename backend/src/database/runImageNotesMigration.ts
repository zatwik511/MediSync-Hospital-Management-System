import { pool } from './db';
import logger from '../logger';

async function run() {
  await pool.query(`
    ALTER TABLE medical_images
    ADD COLUMN IF NOT EXISTS notes TEXT
  `);
  logger.info('Migration complete: medical_images.notes column added');
  await pool.end();
}

run().catch(err => { logger.error({ err }, 'Migration failed'); process.exit(1); });
