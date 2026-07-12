import { pgTable, text, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const salesTable = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  percent: integer("percent").notNull(),
  // "all" applies storewide; "family"/"gender" restrict to products whose
  // matching column equals scopeValue
  scope: text("scope").notNull().default("all"),
  scopeValue: text("scope_value").notNull().default(""),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({
  id: true,
  createdAt: true,
});

export const selectSaleSchema = createSelectSchema(salesTable);

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
