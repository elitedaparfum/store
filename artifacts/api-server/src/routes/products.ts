import { Router, type IRouter } from "express";
import multer from "multer";
import { z } from "zod";
import { db, productsTable, eq } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  family: z.string().min(1, "Family is required"),
  gender: z.string().min(1, "Gender is required"),
  notesTop: z.string().optional(),
  notesHeart: z.string().optional(),
  notesBase: z.string().optional(),
  description: z.string().optional(),
  featured: z.enum(["true", "false"]).optional(),
  sizes: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.length > 0 && parsed.every(p => p.name && typeof p.price === 'number');
    } catch {
      return false;
    }
  }, "Variants must be a valid JSON array"),
  discountPercent: z.string().regex(/^\d*$/, "Discount must be a valid number").optional(),
  existingImages: z.string().optional(),
});

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
    const dbProducts = isAdmin
      ? await db.select().from(productsTable).orderBy(productsTable.createdAt)
      : await db.select().from(productsTable).where(eq(productsTable.inStock, true)).orderBy(productsTable.createdAt);
    
    const products = dbProducts.map(p => {
      let imageCount = 0;
      try { imageCount = JSON.parse(p.images || "[]").length; } catch { /* ignore */ }
      const imageUrls = Array.from({ length: imageCount }, (_, i) => `/api/images/product/${p.id}/${i}`);
      return {
        ...p,
        imageUrl: imageUrls[0] || p.imageUrl,
        images: JSON.stringify(imageUrls),
      };
    });

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
    const [dbProduct] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!dbProduct) { res.status(404).json({ error: "Product not found" }); return; }
    
    let imageCount = 0;
    try { imageCount = JSON.parse(dbProduct.images || "[]").length; } catch { /* ignore */ }
    const imageUrls = Array.from({ length: imageCount }, (_, i) => `/api/images/product/${dbProduct.id}/${i}`);
    
    const product = {
      ...dbProduct,
      imageUrl: imageUrls[0] || dbProduct.imageUrl,
      images: JSON.stringify(imageUrls),
    };

    res.json({ product });
  } catch (err) {
    req.log.error({ err }, "Error fetching product");
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/products", requireAdmin, upload.array("newImages", 10), async (req, res) => {
  try {
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message ?? "Invalid input data" });
      return;
    }
    const { name, family, gender, notesTop, notesHeart, notesBase, description, featured, sizes, discountPercent, existingImages } = parseResult.data;

    // Parse sizes to compute price and inStock
    const parsedSizes = JSON.parse(sizes as string) as { name: string, price: number, inStock: boolean }[];
    const computedPrice = parsedSizes.reduce((min, s) => Math.min(min, s.price), Infinity);
    const computedInStock = parsedSizes.some(s => s.inStock);

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
      price: computedPrice,
      imageUrl: finalImageUrl,
      images: JSON.stringify(allImages),
      notesTop: notesTop ?? "",
      notesHeart: notesHeart ?? "",
      notesBase: notesBase ?? "",
      description: description ?? "",
      featured: featured === "true",
      inStock: computedInStock,
      sizes: sizes as string,
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
    const parseResult = productSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message ?? "Invalid input data" });
      return;
    }
    const { name, family, gender, notesTop, notesHeart, notesBase, description, featured, sizes, discountPercent, existingImages } = parseResult.data;

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (name !== undefined) updates.name = name;
    if (family !== undefined) updates.family = family;
    if (gender !== undefined) updates.gender = gender;
    if (notesTop !== undefined) updates.notesTop = notesTop;
    if (notesHeart !== undefined) updates.notesHeart = notesHeart;
    if (notesBase !== undefined) updates.notesBase = notesBase;
    if (description !== undefined) updates.description = description;
    if (featured !== undefined) updates.featured = featured === "true";
    if (sizes !== undefined) {
      updates.sizes = sizes;
      try {
        const parsedSizes = JSON.parse(sizes) as { name: string, price: number, inStock: boolean }[];
        updates.price = parsedSizes.reduce((min, s) => Math.min(min, s.price), Infinity);
        updates.inStock = parsedSizes.some(s => s.inStock);
      } catch { /* ignore */ }
    }
    if (discountPercent !== undefined && discountPercent !== "") updates.discountPercent = parseInt(discountPercent, 10);

    // Rebuild images if the client sent existingImages (even if empty array)
    if (existingImages !== undefined) {
      const existing = parseImages(existingImages, "");
      
      // Get the current database product to retrieve the raw base64 strings
      const [oldProduct] = await db.select({ images: productsTable.images }).from(productsTable).where(eq(productsTable.id, id)).limit(1);
      const oldParsed = JSON.parse(oldProduct?.images || "[]");

      const resolvedExisting = existing.map(url => {
         // If it's one of our lightweight image URLs, extract the index and pull the raw base64 from the DB
         if (url.startsWith(`/api/images/product/${id}/`)) {
            const idx = parseInt(url.split("/").pop()!, 10);
            return oldParsed[idx] || url;
         }
         return url;
      });

      const uploaded = (req.files as Express.Multer.File[] ?? []).map(f =>
        `data:${f.mimetype};base64,${f.buffer.toString("base64")}`
      );
      const allImages = [...resolvedExisting, ...uploaded];
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
