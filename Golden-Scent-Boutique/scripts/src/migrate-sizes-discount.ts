import { pool } from "@workspace/db";

async function migrate() {
  await pool.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT NOT NULL DEFAULT '30ml,50ml,100ml';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER NOT NULL DEFAULT 0;
  `);
  console.log("Migration done: added sizes + discount_percent columns");
  await pool.end();
}

migrate().catch(e => { console.error(e.message); process.exit(1); });
