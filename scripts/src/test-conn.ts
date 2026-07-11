import pg from "pg";

async function test() {
  const url = "postgresql://postgres:NkbToJLqACVLTIapJRrNqQbSmmkZzcOL@kodama.proxy.rlwy.net:19016/railway";
  console.log("Testing direct connection WITHOUT SSL...");
  const client1 = new pg.Client({ connectionString: url });
  try {
    await client1.connect();
    console.log("SUCCESS without SSL!");
    await client1.end();
    return;
  } catch (err) {
    console.log("Failed without SSL:", err.message || err);
  }

  console.log("\nTesting direct connection WITH SSL (rejectUnauthorized: false)...");
  const client2 = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client2.connect();
    console.log("SUCCESS with SSL!");
    await client2.end();
  } catch (err) {
    console.log("Failed with SSL:", err.message || err);
  }
}

test();
