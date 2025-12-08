import MerchantAccount from "../models/MerchantAccount.js";

/**
 * Multi-tenant middleware
 * Ensures user can only access merchant accounts they own
 */
export const ensureMerchantAccess = async (req, res, next) => {
    try {
        const { merchantId } = req.params;
        const userId = req.user._id;

        if (!merchantId) {
            return next();
        }

        // Check if user owns this merchant account
        const account = await MerchantAccount.findOne({
            _id: merchantId,
            userId,
        });

        if (!account) {
            return res.status(403).json({
                success: false,
                message: "Access denied. This merchant account doesn't belong to you.",
            });
        }

        // Attach account to request for use in controllers
        req.merchantAccount = account;

        next();
    } catch (error) {
        console.error("Error checking merchant access:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify merchant account access",
            error: error.message,
        });
    }
};

/**
 * Check if user has specific permission on merchant account
 * @param {Array<string>} requiredPermissions - Array of permission strings
 */
export const checkMerchantPermission = (requiredPermissions = []) => {
    return async (req, res, next) => {
        try {
            const { merchantId } = req.params;
            const userId = req.user._id;

            if (!merchantId) {
                return next();
            }

            const account = await MerchantAccount.findOne({
                _id: merchantId,
                userId,
            });

            if (!account) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied to this merchant account",
                });
            }

            // Check if user has required permissions
            if (requiredPermissions.length > 0) {
                const hasPermission = requiredPermissions.some(permission =>
                    account.permissions.includes(permission) || 
                    account.permissions.includes("admin")
                );

                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: `Insufficient permissions. Required: ${requiredPermissions.join(", ")}`,
                    });
                }
            }

            req.merchantAccount = account;
            next();
        } catch (error) {
            console.error("Error checking merchant permission:", error);
            res.status(500).json({
                success: false,
                message: "Failed to verify permissions",
                error: error.message,
            });
        }
    };
};

/**
 * Validate default merchant account selected by user
 */
export const validateDefaultAccount = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const defaultAccount = await MerchantAccount.findOne({
            userId,
            isDefault: true,
        });

        if (!defaultAccount) {
            // If no default, select the first available account
            const firstAccount = await MerchantAccount.findOne({ userId })
                .sort({ createdAt: 1 });

            if (firstAccount) {
                firstAccount.isDefault = true;
                await firstAccount.save();
                req.defaultAccount = firstAccount;
            }
        } else {
            req.defaultAccount = defaultAccount;
        }

        next();
    } catch (error) {
        console.error("Error validating default account:", error);
        res.status(500).json({
            success: false,
            message: "Failed to validate default account",
            error: error.message,
        });
    }
};
