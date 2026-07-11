const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const BACKUP_DIR = process.argv[2];
if (!BACKUP_DIR) {
  console.error("Usage: node restore-from-railway-backup.cjs <backup-dir>");
  process.exit(1);
}

// table -> ordered column list, matching lib/db/src/schema/*.ts
const TABLES = {
  users: ["id", "email", "password_hash", "google_id", "reset_token", "reset_token_expires", "is_admin", "created_at"],
  products: [
    "id", "name", "family", "gender", "price", "image_url", "notes_top", "notes_heart",
    "notes_base", "description", "featured", "in_stock", "images", "sizes",
    "discount_percent", "created_at", "updated_at",
  ],
  session: ["sid", "sess", "expire"],
};

// columns whose JS value must be passed as a JSON string for a json/jsonb column
const JSON_COLUMNS = { session: new Set(["sess"]) };

function toParam(table, col, value) {
  if (JSON_COLUMNS[table]?.has(col)) return JSON.stringify(value);
  return value; // pg driver handles ISO date strings, booleans, numbers, null natively
}

async function restoreTable(client, table) {
  const file = path.join(BACKUP_DIR, `${table}.json`);
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  const cols = TABLES[table];

  await client.query(`TRUNCATE TABLE "${table}" CASCADE`);

  for (const row of rows) {
    const values = cols.map((c) => toParam(table, c, row[c] ?? null));
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const colList = cols.map((c) => `"${c}"`).join(", ");
    await client.query(`INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`, values);
  }

  const { rows: countRows } = await client.query(`SELECT COUNT(*)::int AS c FROM "${table}"`);
  console.log(`${table}: inserted ${rows.length} rows from backup, table now has ${countRows[0].c} rows`);
}

async function main() {
  const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // users first (session/products don't FK to users in this schema, but keep a safe order anyway)
    for (const table of ["users", "products", "session"]) {
      await restoreTable(client, table);
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("RESTORE FAILED:", e.message);
  process.exit(1);
});
