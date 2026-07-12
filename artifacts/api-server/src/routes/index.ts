import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import imagesRouter from "./images.js";
import discountsRouter from "./discounts.js";
import salesRouter from "./sales.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(imagesRouter);
router.use(discountsRouter);
router.use(salesRouter);

export default router;
