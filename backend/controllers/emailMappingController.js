import EmailMerchantMapping from "../models/EmailMerchantMapping.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

/**
 * Create or update email to merchant IDs mapping
 */
export const createOrUpdateEmailMapping = async (req, res) => {
    try {
        const { email, merchantIds } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        if (!merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "merchantIds array is required and must not be empty",
            });
        }

        const normalizedEmail = normalizeEmail(email);
        const validMerchantIds = merchantIds
            .map((id) => id.toString().trim())
            .filter((id) => id.length > 0 && /^\d+$/.test(id));

        if (validMerchantIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one valid numeric merchant ID is required",
            });
        }

        const mapping = await EmailMerchantMapping.findOneAndUpdate(
            { email: normalizedEmail },
            {
                email: normalizedEmail,
                merchantIds: validMerchantIds,
                isActive: true,
            },
            { upsert: true, new: true }
        );

        console.log(`[emailMappingController] Created/updated mapping for ${normalizedEmail}: ${validMerchantIds.join(", ")}`);

        res.status(200).json({
            success: true,
            message: "Email mapping created/updated successfully",
            mapping,
        });
    } catch (error) {
        console.error("[emailMappingController] Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create/update email mapping",
            error: error.message,
        });
    }
};

/**
 * Get merchant IDs for an email
 */
export const getEmailMapping = async (req, res) => {
    try {
        const { email } = req.params;
        const normalizedEmail = normalizeEmail(email);

        const mapping = await EmailMerchantMapping.findOne({
            email: normalizedEmail,
            isActive: true,
        });

        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: "No mapping found for this email",
            });
        }

        res.status(200).json({
            success: true,
            mapping,
        });
    } catch (error) {
        console.error("[emailMappingController] Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch email mapping",
            error: error.message,
        });
    }
};

/**
 * Get all email mappings
 */
export const getAllEmailMappings = async (req, res) => {
    try {
        const mappings = await EmailMerchantMapping.find({ isActive: true }).sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            mappings,
        });
    } catch (error) {
        console.error("[emailMappingController] Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch email mappings",
            error: error.message,
        });
    }
};



