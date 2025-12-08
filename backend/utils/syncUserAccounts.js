import { google } from "googleapis";
import MerchantAccount from "../models/MerchantAccount.js";

export const syncUserAccounts = async (user) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL
        );

        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken
        });

        const content = google.content({ version: "v2.1", auth: oauth2Client });

        // FETCH MERCHANT CENTER ACCOUNTS
        const response = await content.accounts.list();
        const accounts = response.data.resources || [];

        for (const acc of accounts) {
            await MerchantAccount.findOneAndUpdate(
                { merchantId: acc.id, userId: user._id },
                {
                    userId: user._id,
                    merchantId: acc.id,
                    name: acc.name
                },
                { upsert: true }
            );
        }

        console.log(`Synced ${accounts.length} merchant accounts for ${user.email}`);
        return accounts;
    } catch (err) {
        console.error("Error syncing accounts:", err.message);
    }
};
