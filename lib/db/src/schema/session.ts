import { pgTable, varchar, json, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Session table for connect-pg-simple.
 * Included in the Drizzle schema so `drizzle-kit push --force` doesn't drop it.
 */
export const sessionTable = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
