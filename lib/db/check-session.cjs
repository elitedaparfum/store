const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await client.connect();
  
  // Check session table
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session'"
  );
  console.log('Session table exists:', tables.rows.length > 0);
  
  if (tables.rows.length > 0) {
    const cols = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'session'"
    );
    console.log('Session columns:', cols.rows);
    
    const count = await client.query("SELECT COUNT(*) FROM session");
    console.log('Session count:', count.rows[0].count);
  } else {
    console.log('Creating session table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")');
    console.log('Session table created');
  }
  
  client.end();
}
main().catch(e => { console.error(e); client.end(); });
