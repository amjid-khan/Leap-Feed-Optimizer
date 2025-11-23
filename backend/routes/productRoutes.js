import express from "express";
import productController from "../controllers/productController.js";

const router = express.Router();

router.post("/:productId/optimize", productController.optimizeProduct);

// ✅ Test route (no productId required, sirf test ke liye)
router.post("/test-optimize", productController.testOptimize);

export default router;
