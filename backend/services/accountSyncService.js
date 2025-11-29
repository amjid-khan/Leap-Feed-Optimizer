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
 * Get account name for a merchant ID (try to fetch from Google API, fallback to merchantId)
 * Since accounts.get doesn't exist, we use a simple naming scheme
 */
const getAccountName = async (merchantId) => {
    try {
        // Try to get website URL from products (if available)
        const authClient = await auth.getClient();
        const content = google.content({ version: "v2.1", auth: authClient });

        // Try to get first product to extract any account info
        const res = await content.products.list({
            merchantId,
            maxResults: 1,
            fields: "resources/feedLabel",
        });

        // Use feedLabel if available, otherwise use merchantId
        const feedLabel = res.data?.resources?.[0]?.feedLabel;
        if (feedLabel) {
            return feedLabel;
        }
    } catch (error) {
        // Ignore errors
    }

    // Fallback to merchant ID
    return `GMC Account ${merchantId}`;
};

/**
 * Sync accounts for a user based on their email
 * This will:
 * 1. Get list of merchant IDs from environment
 * 2. Check which ones are accessible
 * 3. Create/update Account records for accessible merchant IDs
 */
export const syncUserAccounts = async (user) => {
    try {
        if (!user || !user.email) {
            console.log("[accountSyncService] No user or email provided");
            return { success: false, message: "User email required" };
        }

        const userEmail = normalizeEmail(user.email);
        
        // First, try to get merchant IDs from email mapping (automatic detection)
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
            console.log(`[accountSyncService] To enable automatic detection, add email-to-merchant-IDs mapping in database`);
            return { success: true, accounts: [], message: "No merchant IDs configured for this email" };
        }

        console.log(`[accountSyncService] Checking ${merchantIds.length} merchant ID(s) for user ${userEmail}`);

        const accessibleMerchantIds = [];
        const accountPromises = [];

        // Check each merchant ID for accessibility
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
                    accessibleMerchantIds.push(trimmedMerchantId);
                    console.log(`[accountSyncService] ✅ Merchant ID ${trimmedMerchantId} is accessible - will create account`);
                } else {
                    console.log(`[accountSyncService] ❌ Merchant ID ${trimmedMerchantId} is not accessible`);
                }
            } catch (error) {
                console.error(`[accountSyncService] Error checking merchant ID ${merchantId}:`, error.message);
                console.error(`[accountSyncService] Full error:`, error);
            }
        }

        if (accessibleMerchantIds.length === 0) {
            console.log(`[accountSyncService] No accessible merchant IDs found for user ${userEmail}`);
            return { success: true, accounts: [], message: "No accessible merchant accounts found" };
        }

        // Create or update accounts for accessible merchant IDs
        for (const merchantId of accessibleMerchantIds) {
            accountPromises.push(
                (async () => {
                    try {
                        // Check if account already exists for this user
                        let account = await Account.findOne({
                            userId: user._id,
                            merchantId,
                        });

                        if (account) {
                            // Update authorizedEmails if not already present
                            if (!account.authorizedEmails.includes(userEmail)) {
                                account.authorizedEmails.push(userEmail);
                                await account.save();
                            }
                            return account;
                        }

                        // Check if account exists with this email in authorizedEmails
                        account = await Account.findOne({
                            merchantId,
                            authorizedEmails: userEmail,
                        });

                        if (account) {
                            // Link this user as owner if not already linked
                            if (!account.userId || account.userId.toString() !== user._id.toString()) {
                                account.userId = user._id;
                                await account.save();
                            }
                            return account;
                        }

                        // Create new account
                        const accountName = await getAccountName(merchantId);
                        account = await Account.create({
                            accountName,
                            merchantId,
                            userId: user._id,
                            authorizedEmails: [userEmail],
                        });

                        console.log(`[accountSyncService] Created account ${accountName} (${merchantId}) for user ${userEmail}`);
                        return account;
                    } catch (error) {
                        console.error(`[accountSyncService] Error processing merchant ID ${merchantId}:`, error.message);
                        return null;
                    }
                })()
            );
        }

        const accounts = (await Promise.all(accountPromises)).filter((acc) => acc !== null);

        // Auto-select first account if user has no selected account
        if (accounts.length > 0) {
            const dbUser = await User.findById(user._id);
            if (!dbUser.selectedAccount) {
                dbUser.selectedAccount = accounts[0]._id;
                await dbUser.save();
                console.log(`[accountSyncService] Auto-selected account ${accounts[0].accountName} for user ${userEmail}`);
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

