import { pool } from "@workspace/db";

async function migrate() {
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT NOT NULL DEFAULT '[]';`);
  console.log("Migration done: added images column");
  await pool.end();
}

migrate().catch(e => { console.error(e.message); process.exit(1); });
