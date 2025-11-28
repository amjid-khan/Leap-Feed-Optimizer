import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
    {
        accountName: {
            type: String,
            required: true,
            trim: true,
        },
        merchantId: {
            type: String,
            required: true,
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        authorizedEmails: [
            {
                type: String,
                lowercase: true,
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

// Index to ensure unique merchantId per user (same merchantId can be used by different users)
accountSchema.index(
    { userId: 1, merchantId: 1 },
    {
        unique: true,
        partialFilterExpression: { userId: { $type: "objectId" } },
    }
);

// Allow quick lookups by authorized email
accountSchema.index({ authorizedEmails: 1 });

export default mongoose.model("Account", accountSchema);





