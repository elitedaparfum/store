import { Router, type IRouter } from "express";
import multer from "multer";
import { db, productsTable, eq } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

function parseImages(raw: string | undefined, fallbackUrl: string): string[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
  } catch { /* ignore */ }
  return fallbackUrl ? [fallbackUrl] : [];
}

/* Public — only in-stock products; Admin — all products */
router.get("/products", async (req, res) => {
  try {
    const isAdmin = (req.session as { user?: { isAdmin?: boolean } })?.user?.isAdmin === true;
    const products = isAdmin
      ? await db.select().from(productsTable).orderBy(productsTable.createdAt)
      : await db.select().from(productsTable).where(eq(productsTable.inStock, true)).orderBy(productsTable.createdAt);
    res.json({ products });
  } catch (err) {
    req.log.error({ err }, "Error fetching products");
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/* Single product — admin sees it regardless of stock */
router.get("/products/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    res.json({ product });
  } catch (err) {
    req.log.error({ err }, "Error fetching product");
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/products", requireAdmin, upload.array("newImages", 10), async (req, res) => {
  try {
    const { name, family, gender, price, notesTop, notesHeart, notesBase, description, featured, inStock, sizes, discountPercent, existingImages } = req.body as Record<string, string>;

    if (!name || !family || !gender || !price) {
      res.status(400).json({ error: "Name, family, gender, and price are required" });
      return;
    }

    // Build images array: existing URLs first, then newly uploaded files
    const existing = parseImages(existingImages, "");
    const uploaded = (req.files as Express.Multer.File[] ?? []).map(f =>
      `data:${f.mimetype};base64,${f.buffer.toString("base64")}`
    );
    const allImages = [...existing, ...uploaded];
    const finalImageUrl = allImages[0] ?? "";

    const [product] = await db.insert(productsTable).values({
      name,
      family,
      gender,
      price: parseInt(price, 10),
      imageUrl: finalImageUrl,
      images: JSON.stringify(allImages),
      notesTop: notesTop ?? "",
      notesHeart: notesHeart ?? "",
      notesBase: notesBase ?? "",
      description: description ?? "",
      featured: featured ?? "false",
      inStock: inStock !== "false",
      sizes: sizes ?? "30ml,50ml,100ml",
      discountPercent: discountPercent ? parseInt(discountPercent, 10) : 0,
    }).returning();

    res.status(201).json({ product });
  } catch (err) {
    req.log.error({ err }, "Error creating product");
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/products/:id", requireAdmin, upload.array("newImages", 10), async (req, res) => {
  try {
    const id = String(req.params.id);
    const { name, family, gender, price, notesTop, notesHeart, notesBase, description, featured, inStock, sizes, discountPercent, existingImages } = req.body as Record<string, string>;

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (name !== undefined) updates.name = name;
    if (family !== undefined) updates.family = family;
    if (gender !== undefined) updates.gender = gender;
    if (price !== undefined) updates.price = parseInt(price, 10);
    if (notesTop !== undefined) updates.notesTop = notesTop;
    if (notesHeart !== undefined) updates.notesHeart = notesHeart;
    if (notesBase !== undefined) updates.notesBase = notesBase;
    if (description !== undefined) updates.description = description;
    if (featured !== undefined) updates.featured = featured;
    if (inStock !== undefined) updates.inStock = inStock !== "false";
    if (sizes !== undefined) updates.sizes = sizes;
    if (discountPercent !== undefined) updates.discountPercent = parseInt(discountPercent, 10);

    // Rebuild images if the client sent existingImages (even if empty array)
    if (existingImages !== undefined) {
      const existing = parseImages(existingImages, "");
      const uploaded = (req.files as Express.Multer.File[] ?? []).map(f =>
        `data:${f.mimetype};base64,${f.buffer.toString("base64")}`
      );
      const allImages = [...existing, ...uploaded];
      updates.images = JSON.stringify(allImages);
      updates.imageUrl = allImages[0] ?? "";
    } else if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      // Only new files, no existingImages field — append to what's in DB (handled by fetching current)
      const uploaded = (req.files as Express.Multer.File[]).map(f =>
        `data:${f.mimetype};base64,${f.buffer.toString("base64")}`
      );
      updates.images = JSON.stringify(uploaded);
      updates.imageUrl = uploaded[0] ?? "";
    }

    const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    res.json({ product });
  } catch (err) {
    req.log.error({ err }, "Error updating product");
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [deleted] = await db.delete(productsTable).where(eq(productsTable.id, id)).returning({ id: productsTable.id });
    if (!deleted) { res.status(404).json({ error: "Product not found" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Error deleting product");
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
