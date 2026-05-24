const { Client } = require('pg');
const bcrypt = require('C:\\Users\\asjad\\OneDrive\\Documents\\GitHub\\elite-da-parfum\\node_modules\\.pnpm\\bcryptjs@3.0.3\\node_modules\\bcryptjs');
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await client.connect();
  const hash = await bcrypt.hash('Faizaan$000', 12);
  await client.query("UPDATE users SET password_hash = $1 WHERE email = 'contact@elitedaparfum.com'", [hash]);
  console.log('Password set:', await bcrypt.compare('Faizaan$000', hash));
  client.end();
}
main().catch(e => { console.error(e); client.end(); });
