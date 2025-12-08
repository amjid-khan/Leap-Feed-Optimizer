import express from "express";
import { protect as authMiddleware } from "../middleware/authMiddleware.js";
import { getMerchantProducts } from "../controllers/productController.js";

const router = express.Router();

router.get("/products", authMiddleware, getMerchantProducts);

export default router;
