import express from "express";
import passport from "passport";
import {
    googleLoginRedirect,
    googleLoginCallback,
    getMerchantAccounts,
    selectMerchantAccount,
    googleAuthFailure
} from "../controllers/googleAuthController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Initiates Google login with full scopes
router.get("/google", googleLoginRedirect);

// Callback endpoint for Google OAuth
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/auth/google/failure" }),
    googleLoginCallback
);

// Friendly failure endpoint
router.get("/google/failure", googleAuthFailure);

// Get merchant accounts for logged-in user
router.get("/merchant-accounts", protect, getMerchantAccounts);

// Select/switch merchant account
router.post("/select-account", protect, selectMerchantAccount);

export default router;
