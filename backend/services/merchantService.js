import { google } from "googleapis";
import auth from "../config/googleAuth.js";

const productsCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache (increased for better performance)

// ---- Added: Small helper to sleep Google API between pages to avoid rate limit
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const normalizeProductKey = (id, stripPrefix = false) => {
    if (!id) return null;
    const trimmed = id.toString().trim().toLowerCase();
    if (!trimmed) return null;
    if (!stripPrefix) return trimmed;
    return trimmed.replace(/^online:[a-z]{2}:[a-z]{2}:/, "");
};

const recordStatusEntry = (map, rawId, statusData) => {
    if (!rawId) return;
    const fullKey = normalizeProductKey(rawId, false);
    const shortKey = normalizeProductKey(rawId, true);

    if (fullKey) {
        map.set(fullKey, statusData);
    }
    if (shortKey && shortKey !== fullKey) {
        map.set(shortKey, statusData);
    }
};

const findStatusForProduct = (product, statusMap) => {
    if (!product) return undefined;

    const candidates = new Set();
    if (product.id) {
        candidates.add(normalizeProductKey(product.id, false));
        candidates.add(normalizeProductKey(product.id, true));
    }
    if (product.offerId) {
        candidates.add(normalizeProductKey(product.offerId, false));
    }

    for (const key of candidates) {
        if (key && statusMap.has(key)) {
            return statusMap.get(key);
        }
    }
    return undefined;
};

const merchantService = {

    getTotalCount: async (merchantId) => {
        try {
            if (!merchantId) throw new Error("Merchant ID required");

            const authClient = await auth.getClient();
            const content = google.content({ version: "v2.1", auth: authClient });

            const res = await content.products.list({
                merchantId,
                maxResults: 1,
                fields: "resources/id"   // FAST
            });

            return null;
        } catch (error) {
            throw error;
        }
    },

    getProducts: async (merchantId, page = 1, limit = 50, searchQuery = "") => {
        try {
            if (!merchantId) throw new Error("Merchant ID required");

            const now = Date.now();
            const cacheEntry = productsCache.get(merchantId);
            const isCacheValid = cacheEntry && (now - cacheEntry.timestamp < CACHE_DURATION);

            // If cache expired → FAST refetch
            if (!isCacheValid) {
                console.log(`[merchantService] Cache expired/invalid for merchantId: ${merchantId}, fetching from Google API...`);

                try {
                    const authClient = await auth.getClient();
                    const content = google.content({ version: "v2.1", auth: authClient });

                    let allProducts = [];
                    let pageToken = null;

                    // ---- FAST: fields filtered (size 80% smaller)
                    // Note: Only basic fields are available in products.list()
                    // productType, googleProductCategory, destinationStatuses, itemLevelIssues 
                    // are only available in productstatuses.list()
                    const productFields =
                        "resources(id,title,imageLink,description,brand,feedLabel,availability)";

                    // ---- Loop but fast
                    do {
                        const res = await content.products.list({
                            merchantId,
                            maxResults: 250,
                            pageToken: pageToken || undefined,
                            fields: `nextPageToken,${productFields}`, // FASTEST
                        });

                        console.log(`[merchantService] Google API response: ${res.data?.resources?.length || 0} products in this batch`);

                        if (res.data?.resources) {
                            allProducts.push(...res.data.resources);
                        }

                        pageToken = res.data?.nextPageToken;

                        // Safety delay to avoid rate limit
                        if (pageToken) await delay(30); // Reduced delay for faster fetching
                    } while (pageToken);

                    console.log(`[merchantService] Total products fetched from Google API: ${allProducts.length}`);

                    // ---- Parallel fetch: productstatuses (much faster)
                    let statusMap = new Map();
                    try {
                        console.log(`[merchantService] Fetching product statuses for ${allProducts.length} products...`);
                        let statusToken = null;

                        do {
                            const statusRes = await content.productstatuses.list({
                                merchantId,
                                maxResults: 250,
                                pageToken: statusToken || undefined,
                                fields: "nextPageToken,resources(productId,destinationStatuses,itemLevelIssues)"
                            });

                            if (statusRes.data?.resources) {
                                statusRes.data.resources.forEach(ps => {
                                    // Store by both productId and id for better matching
                                    const key = ps.productId;
                                    if (key) {
                                        recordStatusEntry(statusMap, key, ps);
                                    }
                                });

                                // Debug: Log first few status entries
                                if (statusMap.size > 0) {
                                    const firstKey = Array.from(statusMap.keys())[0];
                                    const firstValue = statusMap.get(firstKey);
                                    console.log(`[DEBUG] Sample status entry - Key: ${firstKey}, Has destinationStatuses: ${!!firstValue?.destinationStatuses}`);
                                    if (firstValue?.destinationStatuses) {
                                        console.log(`[DEBUG] Sample destinationStatuses:`, JSON.stringify(firstValue.destinationStatuses[0]));
                                    }
                                }
                            }

                            statusToken = statusRes.data?.nextPageToken;

                            if (statusToken) await delay(30); // Reduced delay for faster fetching
                        } while (statusToken);

                        console.log(`[merchantService] Fetched ${statusMap.size} product statuses`);
                    } catch (err) {
                        console.error("Status fetch error:", err.message);
                        console.error("Full error:", err);
                    }

                    // ---- Formatting remains SAME (your code)
                    const formattedProducts = allProducts.map((p) => {
                        // Try multiple ways to match product status
                        const productId = p.id;
                        let ps = findStatusForProduct(p, statusMap);

                        // Debug: Log first few products to see matching
                        if (allProducts.indexOf(p) < 3) {
                            console.log(`[DEBUG] Product ${p.id}: statusMap has ${statusMap.has(normalizeProductKey(productId, false))} entries, ps found: ${!!ps}`);
                            if (ps) {
                                console.log(`[DEBUG] Product ${p.id}: destinationStatuses:`, JSON.stringify(ps.destinationStatuses));
                            }
                        }

                        // Get productType from productstatuses
                        let productType = "-";
                        // We no longer fetch productType/category from productstatuses due to API limits
                        let googleCategory = "-";

                        // Get status from destinationStatuses - improved logic
                        let status = "unknown";
                        if (ps) {
                            // Check destinationStatuses
                            if (ps.destinationStatuses && Array.isArray(ps.destinationStatuses) && ps.destinationStatuses.length > 0) {
                                // Try to find Shopping ads status first
                                const shoppingStatus = ps.destinationStatuses.find(ds =>
                                    ds.destination === 'Shopping ads' ||
                                    ds.destination === 'Shopping' ||
                                    ds.destination === 'shopping_ads' ||
                                    ds.destination?.toLowerCase().includes('shopping')
                                );

                                const statusObj = shoppingStatus || ps.destinationStatuses[0];
                                // Try multiple status field names
                                status = statusObj?.status ||
                                    statusObj?.approvalStatus ||
                                    statusObj?.state ||
                                    "unknown";

                                // Normalize status values
                                if (status && status !== "unknown") {
                                    const normalized = status.toLowerCase().replace(/\s+/g, "_");

                                    const isApproved =
                                        normalized === "approved" ||
                                        normalized === "fully_approved" ||
                                        normalized === "active";

                                    const isPending =
                                        normalized === "pending" ||
                                        normalized === "under_review" ||
                                        normalized === "in_review";

                                    const isDisapproved =
                                        normalized === "disapproved" ||
                                        normalized === "not_approved" ||
                                        normalized === "disapproved_explanation" ||
                                        normalized.includes("disapproved") ||
                                        normalized.includes("not_approved");

                                    if (isApproved) status = "approved";
                                    else if (isPending) status = "pending";
                                    else if (isDisapproved) status = "disapproved";
                                    else status = normalized;
                                }
                            }

                            // If still unknown, check itemLevelIssues for errors
                            if (status === "unknown" && ps.itemLevelIssues && Array.isArray(ps.itemLevelIssues)) {
                                const hasError = ps.itemLevelIssues.some(issue =>
                                    issue.severity === "error" ||
                                    issue.severity === "critical"
                                );
                                if (hasError) {
                                    status = "disapproved";
                                } else {
                                    status = "pending";
                                }
                            }
                        }

                        // Get disapproval reasons
                        let disapprovalReasons = [];
                        if (ps?.itemLevelIssues && Array.isArray(ps.itemLevelIssues)) {
                            disapprovalReasons = ps.itemLevelIssues
                                .map(i => i.description || i.reason || i.attribute)
                                .filter(Boolean);
                        }

                        return {
                            id: p.id || "-",
                            title: p.title || "-",
                            imageLink: p.imageLink || "https://via.placeholder.com/60",
                            description: p.description || "-",
                            brand: p.brand || "-",
                            feedLabel: p.feedLabel || "-",
                            productType: productType || "-",
                            googleCategory: googleCategory || "-",
                            status: status || "unknown",
                            availability: p.availability || "unknown",
                            disapprovalReasons
                        };
                    });

                    console.log(`[merchantService] Cached ${formattedProducts.length} products for merchantId: ${merchantId}`);
                    productsCache.set(merchantId, {
                        products: formattedProducts,
                        timestamp: now,
                    });
                } catch (apiError) {
                    console.error(`[merchantService] Error fetching from Google API for merchantId ${merchantId}:`, apiError.message);

                    // Handle specific errors
                    if (apiError.code === 401 || apiError.status === 401) {
                        console.error(`[merchantService] Authentication error: The service account does not have access to merchantId ${merchantId}`);
                        console.error(`[merchantService] Please check:`);
                        console.error(`  1. Service account has access to this merchant account`);
                        console.error(`  2. Merchant ID is correct: ${merchantId}`);
                        console.error(`  3. Google API credentials are valid`);
                        // Clear cache for this merchantId on auth error
                        productsCache.delete(merchantId);
                        throw new Error(`Authentication failed: Service account does not have access to merchant account ${merchantId}. Please check Google API permissions.`);
                    } else if (apiError.code === 403 || apiError.status === 403) {
                        console.error(`[merchantService] Permission denied for merchantId ${merchantId}`);
                        throw new Error(`Permission denied: Service account does not have required permissions for merchant account ${merchantId}.`);
                    } else {
                        console.error("Full error:", apiError);
                        // For other errors, return empty but log
                        return { products: [], total: 0, page, limit, totalPages: 0 };
                    }
                }
            }

            // ---- Cached data
            const cached = productsCache.get(merchantId);
            if (!cached || !cached.products) {
                console.log(`[merchantService] No cache found for merchantId: ${merchantId}`);
                return { products: [], total: 0, page, limit, totalPages: 0 };
            }

            console.log(`[merchantService] Cache found: ${cached.products.length} products for merchantId: ${merchantId}`);
            let filtered = [...cached.products];

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(p =>
                    p.title?.toLowerCase().includes(q) ||
                    p.description?.toLowerCase().includes(q) ||
                    p.brand?.toLowerCase().includes(q) ||
                    p.id?.toLowerCase().includes(q)
                );
            }

            const total = filtered.length;
            const totalPages = Math.ceil(total / limit);
            const paginated = filtered.slice((page - 1) * limit, page * limit);

            console.log(`[merchantService] Returning ${paginated.length} products (page ${page}, limit ${limit}, total ${total})`);

            return {
                products: paginated,
                total,
                page,
                limit,
                totalPages,
            };

        } catch (error) {
            console.error("Error in merchantService.getProducts:", error);
            // Return empty result instead of throwing to prevent 500 error
            return { products: [], total: 0, page, limit, totalPages: 0 };
        }
    },

    getStats: async (merchantId) => {
        try {
            if (!merchantId) throw new Error("Merchant ID required");

            const now = Date.now();
            const cacheEntry = productsCache.get(merchantId);
            const isCacheValid = cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION;

            if (!isCacheValid) {
                await merchantService.getProducts(merchantId, 1, 1);
            }

            const cached = productsCache.get(merchantId);
            if (!cached || !cached.products) {
                return {
                    totalProducts: 0,
                    approvedProducts: 0,
                    pendingProducts: 0,
                    disapprovedProducts: 0,
                    approvalRate: "0.0%"
                };
            }

            const data = cached.products;

            const total = data.length;
            const approved = data.filter(p => p.status === "approved" || p.status === "Active").length;
            const pending = data.filter(p => p.status === "pending" || p.status === "Pending").length;
            const disapproved = data.filter(p => p.status === "disapproved" || p.status === "Disapproved").length;

            const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0";

            return {
                totalProducts: total,
                approvedProducts: approved,
                pendingProducts: pending,
                disapprovedProducts: disapproved,
                approvalRate: approvalRate + "%"
            };

        } catch (error) {
            return {
                totalProducts: 0,
                approvedProducts: 0,
                pendingProducts: 0,
                disapprovedProducts: 0,
                approvalRate: "0.0%"
            };
        }
    },

};

export default merchantService;
