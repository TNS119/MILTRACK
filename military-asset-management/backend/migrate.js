import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from './config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const migrate = async () => {
  console.log('Running schema migration...');
  try {
    const sql = readFileSync(join(__dirname, 'sql', 'schema.sql'), 'utf8');
    await query(sql);
    console.log('$$$$Schema applied successfully!');
  } catch (err) {
    console.error('!!!!Migration failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
};

migrate();
