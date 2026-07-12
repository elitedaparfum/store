import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, salesTable, eq } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";
import type { Sale } from "@workspace/db/schema";

const saleBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  percent: z.number().int().min(1).max(90, "Sales are capped at 90% off"),
  scope: z.enum(["all", "family", "gender"]),
  scopeValue: z.string().max(60).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
});

const scopeValueRequired = { message: "A family or gender value is required for scoped sales" };
const saleBodySchema = saleBaseSchema
  .refine(s => s.scope === "all" || (s.scopeValue && s.scopeValue.length > 0), scopeValueRequired);
const saleUpdateSchema = saleBaseSchema.partial()
  .refine(s => s.scope === undefined || s.scope === "all" || (s.scopeValue && s.scopeValue.length > 0), scopeValueRequired);

const router: IRouter = Router();

export function isSaleLive(sale: Sale, now = new Date()): boolean {
  if (!sale.active) return false;
  if (sale.startsAt && now < sale.startsAt) return false;
  if (sale.endsAt && now > sale.endsAt) return false;
  return true;
}

/** Highest live sale percent applying to a product, or 0. */
export function salePercentFor(
  sales: Sale[],
  product: { family: string; gender: string },
  now = new Date(),
): number {
  let best = 0;
  for (const sale of sales) {
    if (!isSaleLive(sale, now)) continue;
    const applies =
      sale.scope === "all" ||
      (sale.scope === "family" && sale.scopeValue.toLowerCase() === product.family.toLowerCase()) ||
      (sale.scope === "gender" && sale.scopeValue.toLowerCase() === product.gender.toLowerCase());
    if (applies && sale.percent > best) best = sale.percent;
  }
  return best;
}

/* Public: currently live sales (for storefront banners) */
router.get("/sales/live", async (req, res) => {
  try {
    const all = await db.select().from(salesTable);
    res.json({ sales: all.filter(s => isSaleLive(s)) });
  } catch (err) {
    req.log.error({ err }, "Error listing live sales");
    res.status(500).json({ error: "Failed to list sales" });
  }
});

/* Admin: list all */
router.get("/sales", requireAdmin, async (req, res) => {
  try {
    const sales = await db.select().from(salesTable).orderBy(salesTable.createdAt);
    res.json({ sales });
  } catch (err) {
    req.log.error({ err }, "Error listing sales");
    res.status(500).json({ error: "Failed to list sales" });
  }
});

/* Admin: create */
router.post("/sales", requireAdmin, async (req, res) => {
  try {
    const parsed = saleBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
      return;
    }
    const s = parsed.data;
    const [sale] = await db.insert(salesTable).values({
      name: s.name,
      percent: s.percent,
      scope: s.scope,
      scopeValue: s.scope === "all" ? "" : (s.scopeValue ?? ""),
      startsAt: s.startsAt ? new Date(s.startsAt) : null,
      endsAt: s.endsAt ? new Date(s.endsAt) : null,
      active: s.active ?? true,
    }).returning();
    res.status(201).json({ sale });
  } catch (err) {
    req.log.error({ err }, "Error creating sale");
    res.status(500).json({ error: "Failed to create sale" });
  }
});

/* Admin: update */
router.put("/sales/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const parsed = saleUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
      return;
    }
    const s = parsed.data;
    const updates: Record<string, unknown> = {};
    if (s.name !== undefined) updates.name = s.name;
    if (s.percent !== undefined) updates.percent = s.percent;
    if (s.scope !== undefined) {
      updates.scope = s.scope;
      if (s.scope === "all") updates.scopeValue = "";
    }
    if (s.scopeValue !== undefined && s.scope !== "all") updates.scopeValue = s.scopeValue;
    if (s.startsAt !== undefined) updates.startsAt = s.startsAt ? new Date(s.startsAt) : null;
    if (s.endsAt !== undefined) updates.endsAt = s.endsAt ? new Date(s.endsAt) : null;
    if (s.active !== undefined) updates.active = s.active;

    const [sale] = await db.update(salesTable).set(updates)
      .where(eq(salesTable.id, id)).returning();
    if (!sale) { res.status(404).json({ error: "Sale not found" }); return; }
    res.json({ sale });
  } catch (err) {
    req.log.error({ err }, "Error updating sale");
    res.status(500).json({ error: "Failed to update sale" });
  }
});

/* Admin: delete */
router.delete("/sales/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [deleted] = await db.delete(salesTable)
      .where(eq(salesTable.id, id)).returning({ id: salesTable.id });
    if (!deleted) { res.status(404).json({ error: "Sale not found" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting sale");
    res.status(500).json({ error: "Failed to delete sale" });
  }
});

export default router;
