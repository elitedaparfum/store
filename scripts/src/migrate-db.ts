import pg from "pg";
import fs from "fs";
import path from "path";

// Simple helper to load .env from workspace root
function loadEnv() {
  const paths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(process.cwd(), "../.env")
  ];

  for (const envPath of paths) {
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment variables from: ${envPath}`);
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const index = trimmed.indexOf("=");
        if (index > 0) {
          const key = trimmed.slice(0, index).trim();
          let val = trimmed.slice(index + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
      break;
    }
  }
}

loadEnv();

const SOURCE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_URL = process.env.DATABASE_URL;

if (!SOURCE_URL || !TARGET_URL) {
  console.error("Error: SOURCE_DATABASE_URL and DATABASE_URL must be defined in the .env file.");
  process.exit(1);
}

async function run() {
  console.log("Connecting to source and target databases with SSL enabled...");
  const sourcePool = new pg.Pool({
    connectionString: SOURCE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const targetPool = new pg.Pool({
    connectionString: TARGET_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connections
    await sourcePool.query("SELECT 1");
    console.log("Connected to SOURCE database (Railway).");
    await targetPool.query("SELECT 1");
    console.log("Connected to TARGET database (Supabase).");

    const tables = ["users", "products", "session"];

    for (const table of tables) {
      console.log(`\n--- Migrating table: ${table} ---`);

      // 1. Fetch all data from source
      const { rows } = await sourcePool.query(`SELECT * FROM "${table}"`);
      console.log(`Fetched ${rows.length} rows from source.`);

      // 2. Clear target table (with CASCADE to handle constraints)
      await targetPool.query(`TRUNCATE TABLE "${table}" CASCADE`);
      console.log(`Truncated target table "${table}".`);

      if (rows.length === 0) {
        console.log(`No rows to migrate for ${table}.`);
        continue;
      }

      // 3. Batch insert rows
      const client = await targetPool.connect();
      try {
        await client.query("BEGIN");
        for (const row of rows) {
          const keys = Object.keys(row);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
          const values = keys.map(k => {
            const val = row[k];
            // Format objects/arrays for JSON columns
            if (val !== null && typeof val === "object" && !(val instanceof Date)) {
              return JSON.stringify(val);
            }
            return val;
          });

          await client.query(
            `INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(", ")}) VALUES (${placeholders})`,
            values
          );
        }
        await client.query("COMMIT");
        console.log(`Inserted ${rows.length} rows into target table "${table}".`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`Error inserting rows into "${table}":`, err);
        throw err;
      } finally {
        client.release();
      }
    }

    console.log("\nDatabase migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

run();
