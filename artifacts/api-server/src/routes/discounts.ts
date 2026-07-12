import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, discountCodesTable, eq, sql } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";

const discountBaseSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").max(32)
    .regex(/^[A-Za-z0-9_-]+$/, "Code may only contain letters, numbers, dashes and underscores"),
  description: z.string().max(200).optional(),
  type: z.enum(["percent", "fixed"]),
  value: z.number().int().positive("Value must be positive"),
  minSubtotal: z.number().int().min(0).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
});

const percentCap = { message: "Percent discounts cannot exceed 100" };
const discountBodySchema = discountBaseSchema
  .refine(d => d.type !== "percent" || d.value <= 100, percentCap);
const discountUpdateSchema = discountBaseSchema.partial()
  .refine(d => d.type !== "percent" || d.value === undefined || d.value <= 100, percentCap);

const router: IRouter = Router();

/* Admin: list all codes */
router.get("/discounts", requireAdmin, async (req, res) => {
  try {
    const codes = await db.select().from(discountCodesTable).orderBy(discountCodesTable.createdAt);
    res.json({ codes });
  } catch (err) {
    req.log.error({ err }, "Error listing discount codes");
    res.status(500).json({ error: "Failed to list discount codes" });
  }
});

/* Admin: create */
router.post("/discounts", requireAdmin, async (req, res) => {
  try {
    const parsed = discountBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
      return;
    }
    const d = parsed.data;
    const [code] = await db.insert(discountCodesTable).values({
      code: d.code.toUpperCase(),
      description: d.description ?? "",
      type: d.type,
      value: d.value,
      minSubtotal: d.minSubtotal ?? 0,
      maxUses: d.maxUses ?? null,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      active: d.active ?? true,
    }).returning();
    res.status(201).json({ code });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505") {
      res.status(409).json({ error: "A code with that name already exists" });
      return;
    }
    req.log.error({ err }, "Error creating discount code");
    res.status(500).json({ error: "Failed to create discount code" });
  }
});

/* Admin: update */
router.put("/discounts/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const parsed = discountUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
      return;
    }
    const d = parsed.data;
    const updates: Record<string, unknown> = {};
    if (d.code !== undefined) updates.code = d.code.toUpperCase();
    if (d.description !== undefined) updates.description = d.description;
    if (d.type !== undefined) updates.type = d.type;
    if (d.value !== undefined) updates.value = d.value;
    if (d.minSubtotal !== undefined) updates.minSubtotal = d.minSubtotal;
    if (d.maxUses !== undefined) updates.maxUses = d.maxUses;
    if (d.startsAt !== undefined) updates.startsAt = d.startsAt ? new Date(d.startsAt) : null;
    if (d.endsAt !== undefined) updates.endsAt = d.endsAt ? new Date(d.endsAt) : null;
    if (d.active !== undefined) updates.active = d.active;

    const [code] = await db.update(discountCodesTable).set(updates)
      .where(eq(discountCodesTable.id, id)).returning();
    if (!code) { res.status(404).json({ error: "Discount code not found" }); return; }
    res.json({ code });
  } catch (err) {
    req.log.error({ err }, "Error updating discount code");
    res.status(500).json({ error: "Failed to update discount code" });
  }
});

/* Admin: delete */
router.delete("/discounts/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [deleted] = await db.delete(discountCodesTable)
      .where(eq(discountCodesTable.id, id)).returning({ id: discountCodesTable.id });
    if (!deleted) { res.status(404).json({ error: "Discount code not found" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting discount code");
    res.status(500).json({ error: "Failed to delete discount code" });
  }
});

/* Public: validate a code against a subtotal. Increments usage on success. */
router.post("/discounts/validate", async (req, res) => {
  try {
    const parsed = z.object({
      code: z.string().min(1),
      subtotal: z.number().min(0),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Code and subtotal are required" });
      return;
    }
    const { code: rawCode, subtotal } = parsed.data;

    const [code] = await db.select().from(discountCodesTable)
      .where(eq(discountCodesTable.code, rawCode.toUpperCase())).limit(1);

    const fail = (reason: string) => res.status(422).json({ valid: false, error: reason });

    if (!code || !code.active) { fail("Invalid or inactive code"); return; }
    const now = new Date();
    if (code.startsAt && now < code.startsAt) { fail("This code is not active yet"); return; }
    if (code.endsAt && now > code.endsAt) { fail("This code has expired"); return; }
    if (code.maxUses !== null && code.usedCount >= code.maxUses) { fail("This code has reached its usage limit"); return; }
    if (subtotal < code.minSubtotal) { fail(`Minimum order of $${code.minSubtotal} required`); return; }

    const discountAmount = code.type === "percent"
      ? Math.round(subtotal * (code.value / 100))
      : Math.min(code.value, subtotal);

    res.json({
      valid: true,
      code: code.code,
      type: code.type,
      value: code.value,
      discountAmount,
      total: Math.max(0, subtotal - discountAmount),
    });
  } catch (err) {
    req.log.error({ err }, "Error validating discount code");
    res.status(500).json({ error: "Failed to validate code" });
  }
});

/* Public: record a redemption when an order is actually placed. */
router.post("/discounts/redeem", async (req, res) => {
  try {
    const parsed = z.object({ code: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Code is required" }); return; }

    await db.update(discountCodesTable)
      .set({ usedCount: sql`${discountCodesTable.usedCount} + 1` })
      .where(eq(discountCodesTable.code, parsed.data.code.toUpperCase()));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error redeeming discount code");
    res.status(500).json({ error: "Failed to redeem code" });
  }
});

export default router;
