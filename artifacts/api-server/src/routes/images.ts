import { Router, type IRouter } from "express";
import { db, productsTable, eq } from "@workspace/db";

const router: IRouter = Router();

router.get("/images/product/:id/:index", async (req, res) => {
  try {
    const { id, index } = req.params;
    const [product] = await db
      .select({ images: productsTable.images })
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1);

    if (!product || !product.images) {
      res.status(404).send("Not found");
      return;
    }

    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(product.images);
    } catch {
      res.status(404).send("Not found");
      return;
    }

    const imgIndex = parseInt(index, 10);
    const dataUri = parsedImages[imgIndex];

    if (!dataUri || !dataUri.startsWith("data:image/")) {
      // Fallback if the URL is not a data URI (e.g. an external https:// link)
      if (dataUri && dataUri.startsWith("http")) {
        res.redirect(dataUri);
        return;
      }
      res.status(404).send("Not found");
      return;
    }

    // Expected format: data:image/jpeg;base64,...
    const matches = dataUri.match(/^data:image\/([a-zA-Z0-9+-]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(404).send("Not found");
      return;
    }

    const ext = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    res.setHeader("Content-Type", `image/${ext}`);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // 1 year cache
    res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "Error serving image");
    res.status(500).send("Internal server error");
  }
});

export default router;
