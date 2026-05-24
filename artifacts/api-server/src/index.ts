import app from "./app";
import { logger } from "./lib/logger";
import { seedAdminUser } from "./lib/seed.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Seed admin user on startup (idempotent — skips if users exist)
seedAdminUser().catch((err) => {
  logger.error({ err }, "Failed to seed admin user (non-fatal)");
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
