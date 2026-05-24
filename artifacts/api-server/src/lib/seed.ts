import bcrypt from "bcryptjs";
import { db, usersTable, count } from "@workspace/db";
import { logger } from "./logger.js";

/**
 * Seeds the admin user on first boot if no users exist and
 * ADMIN_EMAIL / ADMIN_PASSWORD env vars are set.
 *
 * This is idempotent — if any user already exists in the DB, it does nothing.
 */
export async function seedAdminUser(): Promise<void> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "contact@elitedaparfum.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    logger.info("ADMIN_PASSWORD not set — skipping admin seed");
    return;
  }

  // Only seed if the users table is completely empty
  const [result] = await db.select({ count: count() }).from(usersTable);
  if ((result?.count ?? 0) > 0) {
    logger.info("Users already exist — skipping admin seed");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.insert(usersTable).values({
    email: adminEmail,
    passwordHash,
    isAdmin: true,
  });

  logger.info({ email: adminEmail }, "Admin user seeded successfully");
}
