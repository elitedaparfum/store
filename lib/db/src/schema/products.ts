import { pgTable, text, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  family: text("family").notNull(),
  gender: text("gender").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  notesTop: text("notes_top").notNull().default(""),
  notesHeart: text("notes_heart").notNull().default(""),
  notesBase: text("notes_base").notNull().default(""),
  description: text("description").notNull().default(""),
  featured: boolean("featured").notNull().default(false),
  inStock: boolean("in_stock").notNull().default(true),
  images: text("images").notNull().default("[]"),
  sizes: text("sizes").notNull().default("[]"),
  discountPercent: integer("discount_percent").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectProductSchema = createSelectSchema(productsTable);

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
