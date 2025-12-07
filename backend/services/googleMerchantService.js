import { google } from "googleapis";
import User from "../models/User.js";

export const fetchGoogleMerchantAccounts = async (user) => {
    try {
        if (!user.googleAccessToken || !user.googleRefreshToken) {
            console.error("Missing Google tokens for:", user.email);
            return [];
        }

        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        auth.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
        });

        const content = google.content({ version: "v2.1", auth });

        console.log(`Fetching ALL merchant accounts for: ${user.email}`);

        // STEP 1: Get list of merchant accounts linked to this Google Account
        const authInfo = await content.accounts.authinfo();
        const identifiers = authInfo.data.accountIdentifiers || [];

        console.log("Merchant Identifiers found:", identifiers);

        const accounts = [];

        // STEP 2: Loop through all merchantIds
        for (const acc of identifiers) {
            if (!acc.merchantId) continue;

            try {
                const response = await content.accounts.get({
                    merchantId: acc.merchantId,
                    accountId: acc.merchantId
                });

                const account = response.data;

                accounts.push({
                    id: account.id,
                    name: account.name || "Unnamed Account",
                    email: account.businessInformation?.customerService?.email || user.email,
                    websiteUrl: account.websiteUrl || "",
                    businessType: account.accountManagement || "unknown",
                    adultContent: account.adultContent || false,
                    status: account.adsLinks?.[0]?.status || "unknown",
                    reviewStatus: account.reviewStatus || "",
                    businessAddress: account.businessInformation?.address || {},
                    phoneNumber: account.businessInformation?.phoneNumber || "",
                    customerService: account.businessInformation?.customerService || {},
                });

                console.log("Fetched account:", account.id);

            } catch (err) {
                console.error(`Error fetching merchant ${acc.merchantId}:`, err.message);
            }
        }

        console.log(`Total merchant accounts fetched: ${accounts.length}`);

        // Save to DB
        user.googleMerchantAccounts = accounts;

        // Set default selected account
        if (!user.selectedAccount && accounts.length > 0) {
            user.selectedAccount = accounts[0].id;
        }

        await user.save();
        console.log(`Saved ${accounts.length} accounts for: ${user.email}`);

        return accounts;

    } catch (error) {
        console.error("ERROR in fetchGoogleMerchantAccounts:", error.message);
        return [];
    }
};
