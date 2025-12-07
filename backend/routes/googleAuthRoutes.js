import express from "express";
import passport from "passport";
import { googleLoginRedirect, googleLoginCallback, getMerchantAccounts, selectMerchantAccount } from "../controllers/googleAuthController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/google", googleLoginRedirect);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    googleLoginCallback
);

// Get merchant accounts for logged-in user
router.get("/merchant-accounts", protect, getMerchantAccounts);

// Select/switch merchant account
router.post("/select-account", protect, selectMerchantAccount);

export default router;
