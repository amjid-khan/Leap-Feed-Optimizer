import mongoose from "mongoose";

/**
 * Email to Merchant ID mapping
 * This allows automatic detection of merchant accounts for a user email
 */
const emailMerchantMappingSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
            index: true,
        },
        merchantIds: [
            {
                type: String,
                trim: true,
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("EmailMerchantMapping", emailMerchantMappingSchema);


