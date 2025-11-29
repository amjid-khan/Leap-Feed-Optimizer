import { google } from "googleapis";
import auth from "../config/googleAuth.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import EmailMerchantMapping from "../models/EmailMerchantMapping.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeEmail = (email = "") => email.trim().toLowerCase();

/**
 * Get service account email from key file
 */
const getServiceAccountEmail = () => {
    try {
        const keyFilePath = path.join(__dirname, "../service_account_key.json");
        const keyFile = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));
        return keyFile.client_email || "service-account-email-not-found";
    } catch (error) {
        console.error("[accountSyncService] Error reading service account key:", error.message);
        return "service-account-email-not-found";
    }
};

/**
 * Check if a merchant ID is accessible by the service account
 * We check by trying to list products (with minimal fields for speed)
 */
const checkMerchantAccess = async (merchantId) => {
    try {
        console.log(`[accountSyncService] Attempting to check access for Merchant ID: ${merchantId}`);
        
        const authClient = await auth.getClient();
        const serviceAccountEmail = getServiceAccountEmail();
        console.log(`[accountSyncService] Using service account: ${serviceAccountEmail}`);
        
        const content = google.content({ version: "v2.1", auth: authClient });

        // Try to fetch products list (minimal query) - if accessible, this will succeed
        console.log(`[accountSyncService] Calling Google API: products.list for merchantId ${merchantId}`);
        const response = await content.products.list({
            merchantId,
            maxResults: 1,
            fields: "resources/id", // Minimal fields for speed
        });

        console.log(`[accountSyncService] ✅ SUCCESS: Merchant ID ${merchantId} is accessible!`);
        console.log(`[accountSyncService] Response received: ${response.data ? 'Data found' : 'No data'}`);
        
        return true;
    } catch (error) {
        // Log detailed error for debugging
        const errorCode = error.code || error.status || error.response?.status;
        const errorMessage = error.message || error.response?.data?.error?.message || JSON.stringify(error.response?.data) || "Unknown error";
        const errorDetails = error.response?.data || {};
        
        console.log(`[accountSyncService] ❌ FAILED: Merchant ID ${merchantId} access check failed:`);
        console.log(`  - Error Code: ${errorCode}`);
        console.log(`  - Error Message: ${errorMessage}`);
        console.log(`  - Full Error Details:`, JSON.stringify(errorDetails, null, 2));
        
        // If 401/403, account is not accessible
        if (errorCode === 401 || errorCode === 403 || error.status === 401 || error.status === 403) {
            const serviceAccountEmail = getServiceAccountEmail();
            console.log(`  - Reason: Service account does not have access to this merchant account`);
            console.log(`  - Solution: Add this email to Google Merchant Center account ${merchantId} as an admin user:`);
            console.log(`    Email: ${serviceAccountEmail}`);
            console.log(`    Steps:`);
            console.log(`    1. Go to Google Merchant Center (merchants.google.com)`);
            console.log(`    2. Select account with ID: ${merchantId}`);
            console.log(`    3. Go to Settings > Users`);
            console.log(`    4. Add user: ${serviceAccountEmail} with Admin access`);
            return false;
        }
        
        // For 404, merchant ID might be wrong
        if (errorCode === 404) {
            console.log(`  - Reason: Merchant ID ${merchantId} not found (404)`);
            console.log(`  - Solution: Verify the Merchant ID is correct`);
            return false;
        }
        
        // For other errors, log and return false
        console.log(`  - Reason: API call failed with code ${errorCode}`);
        console.log(`  - Full error object:`, error);
        return false;
    }
};

/**
 * Get list of merchant IDs from environment variable
 * Format: MERCHANT_IDS="id1,id2,id3" or MERCHANT_IDS="id1:id2:id3"
 */
const getMerchantIdsFromEnv = () => {
    const merchantIdsStr = process.env.MERCHANT_IDS || "";
    if (!merchantIdsStr.trim()) {
        return [];
    }

    // Support both comma and colon separated
    return merchantIdsStr
        .split(/[,:]/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
};

/**
 * Get merchant IDs for a user email from database mapping
 * This allows automatic detection based on email
 */
const getMerchantIdsForEmail = async (userEmail) => {
    try {
        const normalizedEmail = normalizeEmail(userEmail);
        const mapping = await EmailMerchantMapping.findOne({
            email: normalizedEmail,
            isActive: true,
        });

        if (mapping && mapping.merchantIds && mapping.merchantIds.length > 0) {
            console.log(`[accountSyncService] Found ${mapping.merchantIds.length} merchant ID(s) for email ${normalizedEmail} from database mapping`);
            return mapping.merchantIds.filter((id) => id && id.trim().length > 0);
        }

        return [];
    } catch (error) {
        console.error(`[accountSyncService] Error fetching merchant IDs for email ${userEmail}:`, error.message);
        return [];
    }
};

/**
 * Automatically detect all merchant accounts accessible by the service account
 * Uses accounts.list() API to get all merchant accounts
 */
const getAllAccessibleMerchantAccounts = async () => {
    try {
        const authClient = await auth.getClient();
        const content = google.content({ version: "v2.1", auth: authClient });

        console.log(`[accountSyncService] Fetching all accessible merchant accounts using accounts.list()...`);

        // Get all merchant accounts accessible by the service account
        const response = await content.accounts.list();

        if (!response.data || !response.data.resources) {
            console.log(`[accountSyncService] No merchant accounts found in accounts.list() response`);
            return [];
        }

        const accounts = response.data.resources || [];
        console.log(`[accountSyncService] Found ${accounts.length} merchant account(s) via accounts.list()`);

        // Map to merchant account info with account name and ID
        const merchantAccounts = accounts.map((account) => {
            const merchantId = account.id || account.accountId;
            const accountName = account.name || null;
            const websiteUrl = account.websiteUrl || null;

            // Extract domain from website URL if account name is not available
            let finalAccountName = accountName;
            if (!finalAccountName && websiteUrl) {
                try {
                    const url = new URL(websiteUrl);
                    finalAccountName = url.hostname.replace(/^www\./, "");
                } catch (e) {
                    finalAccountName = websiteUrl;
                }
            }

            // Fallback to merchant ID if no name available
            if (!finalAccountName) {
                finalAccountName = `GMC Account ${merchantId}`;
            }

            return {
                merchantId: String(merchantId),
                accountName: finalAccountName,
                websiteUrl,
            };
        });

        return merchantAccounts;
    } catch (error) {
        const errorCode = error.code || error.status || error.response?.status;
        const errorMessage = error.message || error.response?.data?.error?.message || "Unknown error";

        console.error(`[accountSyncService] Error fetching merchant accounts via accounts.list():`, errorMessage);
        console.error(`[accountSyncService] Error code: ${errorCode}`);

        // If accounts.list() is not available or fails, return empty array
        // We'll fall back to email mapping or env variable
        return [];
    }
};

/**
 * Get account information for a merchant ID from Google Merchant Center API
 * Returns account name and other details
 */
const getAccountInfo = async (merchantId) => {
    try {
        const authClient = await auth.getClient();
        const content = google.content({ version: "v2.1", auth: authClient });

        // Try to get account information using accounts.get
        try {
            const accountRes = await content.accounts.get({
                merchantId,
            });

            const accountName = accountRes.data?.name;
            const websiteUrl = accountRes.data?.websiteUrl;

            // Prefer account name, fallback to website domain
            if (accountName && accountName.trim()) {
                console.log(`[accountSyncService] Got account name "${accountName}" from accounts.get() for merchantId ${merchantId}`);
                return { accountName: accountName.trim(), websiteUrl };
            }

            // Extract domain from website URL
            if (websiteUrl) {
                try {
                    const url = new URL(websiteUrl);
                    const domain = url.hostname.replace(/^www\./, "");
                    console.log(`[accountSyncService] Extracted domain "${domain}" from websiteUrl for merchantId ${merchantId}`);
                    return { accountName: domain, websiteUrl };
                } catch (e) {
                    // If URL parsing fails, use websiteUrl as is
                    return { accountName: websiteUrl, websiteUrl };
                }
            }
        } catch (accountError) {
            // accounts.get might not be available, try alternative method
            console.log(`[accountSyncService] accounts.get() not available for merchantId ${merchantId}, trying alternative method`);
        }

        // Alternative: Try to get website URL from products (get multiple products to find a valid link)
        try {
            const productsRes = await content.products.list({
                merchantId,
                maxResults: 10, // Get more products to find one with a valid link
                fields: "resources(link,offerId)",
            });

            const products = productsRes.data?.resources || [];
            
            // Find first product with a valid link
            for (const product of products) {
                if (product?.link) {
                    try {
                        const url = new URL(product.link);
                        const domain = url.hostname.replace(/^www\./, "");
                        console.log(`[accountSyncService] Extracted domain "${domain}" from product link for merchantId ${merchantId}`);
                        return { accountName: domain, websiteUrl: product.link };
                    } catch (e) {
                        // Continue to next product if URL parsing fails
                        continue;
                    }
                }
            }
        } catch (productError) {
            // Ignore errors
            console.log(`[accountSyncService] Could not get account info from products for merchantId ${merchantId}`);
        }
    } catch (error) {
        console.error(`[accountSyncService] Error getting account info for merchantId ${merchantId}:`, error.message);
    }

    // Fallback to merchant ID
    console.log(`[accountSyncService] Using fallback account name for merchantId ${merchantId}`);
    return { accountName: `GMC Account ${merchantId}`, websiteUrl: null };
};

/**
 * Get account name for a merchant ID (wrapper for getAccountInfo)
 */
const getAccountName = async (merchantId) => {
    const accountInfo = await getAccountInfo(merchantId);
    return accountInfo.accountName;
};

/**
 * Sync accounts for a user based on their email
 * This will:
 * 1. First try to automatically detect all merchant accounts using accounts.list()
 * 2. If that fails, get merchant IDs from email mapping or environment variable
 * 3. Check which ones are accessible
 * 4. Create/update Account records for accessible merchant IDs with proper account names
 */
export const syncUserAccounts = async (user) => {
    try {
        if (!user || !user.email) {
            console.log("[accountSyncService] No user or email provided");
            return { success: false, message: "User email required" };
        }

        const userEmail = normalizeEmail(user.email);
        
        // Step 1: Try to automatically detect all merchant accounts using accounts.list()
        let merchantAccounts = await getAllAccessibleMerchantAccounts();
        
        // Step 2: If automatic detection failed, fall back to email mapping or env variable
        if (merchantAccounts.length === 0) {
            console.log(`[accountSyncService] Automatic detection via accounts.list() returned no accounts, trying email mapping...`);
            
            // Get merchant IDs from email mapping
            let merchantIds = await getMerchantIdsForEmail(userEmail);
            
            // If no mapping found, fall back to environment variable
            if (merchantIds.length === 0) {
                merchantIds = getMerchantIdsFromEnv();
                if (merchantIds.length > 0) {
                    console.log(`[accountSyncService] Using merchant IDs from MERCHANT_IDS env variable`);
                }
            }

            if (merchantIds.length === 0) {
                console.log(`[accountSyncService] No merchant IDs found for email ${userEmail} (neither in database mapping nor in MERCHANT_IDS env variable)`);
                console.log(`[accountSyncService] To enable automatic detection, ensure service account has access to merchant accounts`);
                return { success: true, accounts: [], message: "No merchant IDs configured for this email" };
            }

            console.log(`[accountSyncService] Checking ${merchantIds.length} merchant ID(s) for user ${userEmail}`);

            // Check each merchant ID for accessibility and get account info
            for (const merchantId of merchantIds) {
                try {
                    // Validate merchant ID format (should be numeric string)
                    if (!merchantId || !/^\d+$/.test(merchantId.trim())) {
                        console.log(`[accountSyncService] ⚠️ Invalid merchant ID format: "${merchantId}" (should be numeric)`);
                        continue;
                    }

                    const trimmedMerchantId = merchantId.trim();
                    console.log(`[accountSyncService] Checking merchant ID: "${trimmedMerchantId}"`);
                    
                    const isAccessible = await checkMerchantAccess(trimmedMerchantId);
                    if (isAccessible) {
                        // Get account info with proper name
                        const accountInfo = await getAccountInfo(trimmedMerchantId);
                        merchantAccounts.push({
                            merchantId: trimmedMerchantId,
                            accountName: accountInfo.accountName,
                            websiteUrl: accountInfo.websiteUrl,
                        });
                        console.log(`[accountSyncService] ✅ Merchant ID ${trimmedMerchantId} is accessible - will create account "${accountInfo.accountName}"`);
                    } else {
                        console.log(`[accountSyncService] ❌ Merchant ID ${trimmedMerchantId} is not accessible`);
                    }
                } catch (error) {
                    console.error(`[accountSyncService] Error checking merchant ID ${merchantId}:`, error.message);
                    console.error(`[accountSyncService] Full error:`, error);
                }
            }
        } else {
            console.log(`[accountSyncService] ✅ Automatically detected ${merchantAccounts.length} merchant account(s) via accounts.list()`);
        }

        if (merchantAccounts.length === 0) {
            console.log(`[accountSyncService] No accessible merchant accounts found for user ${userEmail}`);
            return { success: true, accounts: [], message: "No accessible merchant accounts found" };
        }

        // Step 3: Create or update accounts for accessible merchant accounts
        const accountPromises = merchantAccounts.map(
            async ({ merchantId, accountName, websiteUrl }) => {
                try {
                    // Check if account already exists for this user
                    let account = await Account.findOne({
                        userId: user._id,
                        merchantId,
                    });

                    if (account) {
                        // Update account name if it changed and authorizedEmails if not already present
                        if (account.accountName !== accountName) {
                            account.accountName = accountName;
                        }
                        if (!account.authorizedEmails.includes(userEmail)) {
                            account.authorizedEmails.push(userEmail);
                        }
                        await account.save();
                        return account;
                    }

                    // Check if account exists with this email in authorizedEmails
                    account = await Account.findOne({
                        merchantId,
                        authorizedEmails: userEmail,
                    });

                    if (account) {
                        // Update account name if it changed
                        if (account.accountName !== accountName) {
                            account.accountName = accountName;
                            await account.save();
                        }
                        // Link this user as owner if not already linked
                        if (!account.userId || account.userId.toString() !== user._id.toString()) {
                            account.userId = user._id;
                            await account.save();
                        }
                        return account;
                    }

                    // Create new account with proper account name
                    account = await Account.create({
                        accountName,
                        merchantId,
                        userId: user._id,
                        authorizedEmails: [userEmail],
                    });

                    console.log(`[accountSyncService] Created account "${accountName}" (${merchantId}) for user ${userEmail}`);
                    return account;
                } catch (error) {
                    console.error(`[accountSyncService] Error processing merchant ID ${merchantId}:`, error.message);
                    return null;
                }
            }
        );

        const accounts = (await Promise.all(accountPromises)).filter((acc) => acc !== null);

        // Auto-select first account if user has no selected account
        if (accounts.length > 0) {
            const dbUser = await User.findById(user._id);
            if (!dbUser.selectedAccount) {
                dbUser.selectedAccount = accounts[0]._id;
                await dbUser.save();
                console.log(`[accountSyncService] Auto-selected account "${accounts[0].accountName}" for user ${userEmail}`);
            }
        }

        console.log(`[accountSyncService] Successfully synced ${accounts.length} account(s) for user ${userEmail}`);

        return {
            success: true,
            accounts,
            message: `Synced ${accounts.length} account(s) for user ${userEmail}`,
        };
    } catch (error) {
        console.error("[accountSyncService] Error syncing accounts:", error);
        return {
            success: false,
            message: error.message || "Failed to sync accounts",
        };
    }
};

export default {
    syncUserAccounts,
};

