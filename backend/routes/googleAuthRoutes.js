import express from "express";
import passport from "passport";
<<<<<<< HEAD
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
=======
import { googleAuthCallback, googleAuthFailure } from "../controllers/googleAuthController.js";

const router = express.Router();

// Initiates Google login (only request basic scopes to avoid sensitive-scope verification)
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

// Callback endpoint that issues JWT and redirects to client
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/auth/google/failure" }),
    googleAuthCallback
);

router.get("/google/failure", googleAuthFailure);
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe

export default router;
