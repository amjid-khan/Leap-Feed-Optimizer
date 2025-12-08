<<<<<<< HEAD
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { fetchGoogleMerchantAccounts } from "../services/googleMerchantService.js";

export const googleLoginRedirect = passport.authenticate("google", {
    scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/content"
    ],
    accessType: "offline",
    prompt: "consent"
});


export const googleLoginCallback = async (req, res) => {
    try {
        const user = req.user;

        console.log(`\n========== GOOGLE LOGIN START =========`);
        console.log(`User: ${user.email}`);
        console.log(`User ID: ${user._id}`);
        console.log(`Has googleAccessToken: ${!!user.googleAccessToken}`);
        console.log(`Has googleRefreshToken: ${!!user.googleRefreshToken}`);

        // Fetch merchant accounts linked to this email
        console.log(`\nAttempting to fetch merchant accounts...`);
        const accounts = await fetchGoogleMerchantAccounts(user);
        console.log(`Fetched ${accounts.length} merchant accounts for ${user.email}`);

        // Reload user from database to get updated data
        const updatedUser = await User.findById(user._id);
        console.log(`\nDatabase check:`);
        console.log(`Accounts in DB: ${updatedUser.googleMerchantAccounts.length}`);
        console.log(`Selected Account: ${updatedUser.selectedAccount}`);

        const token = jwt.sign(
            {
                id: updatedUser._id,
                email: updatedUser.email,
                selectedAccount: updatedUser.selectedAccount
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Return token with merchant account info
        const callbackUrl = `${process.env.CLIENT_URL}/admin?token=${token}`;
        console.log(`\nRedirecting to: ${callbackUrl}`);
        console.log(`========== GOOGLE LOGIN END =========\n`);

        return res.redirect(callbackUrl);
    } catch (error) {
        console.error("Google Auth Error:", error.message);
        console.error("Full error:", error);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
    }
};

export const getMerchantAccounts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            accounts: user.googleMerchantAccounts,
            selectedAccount: user.selectedAccount,
            email: user.email
        });
    } catch (error) {
        console.error("Error fetching merchant accounts:", error.message);
        res.status(500).json({ error: "Failed to fetch merchant accounts" });
    }
};

export const selectMerchantAccount = async (req, res) => {
    try {
        const { merchantId } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify account exists in user's accounts
        const accountExists = user.googleMerchantAccounts.some(acc => acc.id === merchantId);

        if (!accountExists) {
            return res.status(400).json({ error: "Merchant account not found" });
        }

        user.selectedAccount = merchantId;
        await user.save();

        res.json({
            message: "Account selected successfully",
            selectedAccount: user.selectedAccount
        });
    } catch (error) {
        console.error("Error selecting merchant account:", error.message);
        res.status(500).json({ error: "Failed to select merchant account" });
    }
=======
import jwt from "jsonwebtoken";

// Redirect handler is handled by passport in the route; this file provides callback and failure handlers.
export const googleAuthCallback = (req, res) => {
	try {
		if (!req.user) {
			return res.redirect("/auth/google/failure");
		}

		const token = jwt.sign(
			{ id: req.user._id, email: req.user.email },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);

		// Redirect to client with token (client should extract and store it)
		return res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
	} catch (err) {
		console.error("Google callback error:", err);
		return res.redirect("/auth/google/failure");
	}
};

export const googleAuthFailure = (req, res) => {
	// Give a friendly message for failures; client can handle `/auth/google/failure` route
	return res.status(401).json({ success: false, message: "Google authentication failed" });
};

export default {
	googleAuthCallback,
	googleAuthFailure,
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
};
