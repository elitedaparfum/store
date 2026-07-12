import { pgTable, text, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const discountCodesTable = pgTable("discount_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description").notNull().default(""),
  // "percent" discounts value% off the subtotal; "fixed" subtracts value dollars
  type: text("type").notNull().default("percent"),
  value: integer("value").notNull(),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  // null means unlimited uses
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodesTable).omit({
  id: true,
  usedCount: true,
  createdAt: true,
});

export const selectDiscountCodeSchema = createSelectSchema(discountCodesTable);

export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discountCodesTable.$inferSelect;
