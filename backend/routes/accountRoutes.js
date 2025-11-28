import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    getUserAccounts,
    updateAccount,
    deleteAccount,
    getAccount,
    switchAccount,
} from "../controllers/accountController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/", getUserAccounts);
router.get("/:id", getAccount);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);
router.post("/:id/switch", switchAccount);

export default router;

