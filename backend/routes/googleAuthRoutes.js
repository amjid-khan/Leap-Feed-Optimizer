import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { syncUserAccounts } from "../services/accountSyncService.js";

const router = express.Router();

// Redirect to Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google callback
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    async (req, res) => {
        try {
            // Auto-sync accounts for this user
            await syncUserAccounts(req.user);

            const token = jwt.sign({ id: req.user._id, email: req.user.email }, process.env.JWT_SECRET, {
                expiresIn: "1d",
            });

            // Redirect to frontend with token
            res.redirect(`${process.env.CLIENT_URL}/admin?token=${token}`);
        } catch (error) {
            console.error("[googleAuthRoutes] Error in callback:", error);
            // Still redirect even if sync fails
            const token = jwt.sign({ id: req.user._id, email: req.user.email }, process.env.JWT_SECRET, {
                expiresIn: "1d",
            });
            res.redirect(`${process.env.CLIENT_URL}/admin?token=${token}`);
        }
    }
);

export default router;
