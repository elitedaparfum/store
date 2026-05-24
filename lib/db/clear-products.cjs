const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await client.connect();
  await client.query("DELETE FROM products");
  console.log('All products deleted.');
  client.end();
}
main().catch(e => { console.error(e); client.end(); });
