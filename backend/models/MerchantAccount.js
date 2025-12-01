
import mongoose from "mongoose";

const merchantAccountSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    merchantId: { type: String, required: true },
    name: { type: String },
}, { timestamps: true });

export default mongoose.model("MerchantAccount", merchantAccountSchema);
