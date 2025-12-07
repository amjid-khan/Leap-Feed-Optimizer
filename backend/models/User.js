import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, "Invalid Email"],
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        password: {
            type: String,
            minlength: 6,
            required: function () {
                return !this.googleId;
            },
        },

        // GOOGLE AUTH DATA
        googleId: { type: String, unique: true, sparse: true },
        googlePicture: String,

        googleAccessToken: String,
        googleRefreshToken: String,
        googleTokenExpiry: Date,
        googleScopes: { type: [String], default: [] },

        // MULTI TENANT - Google Merchant Center Accounts
        googleMerchantAccounts: [{
            id: String,          // Merchant ID
            name: String,        // Account name
            email: String,       // Account email
            websiteUrl: String,
            businessType: String, // e.g., "manual", "dmsa", etc.
            adultContent: Boolean,
            status: String,      // e.g., "active", "pending", etc. from adsLinks
            reviewStatus: String,
            phoneNumber: String,
            businessAddress: {
                streetAddress: String,
                locality: String,
                postalCode: String,
                country: String
            },
            customerService: {
                url: String,
                email: String,
                phoneNumber: String
            }
        }],
        selectedAccount: {
            type: String,        // Merchant ID
            default: null
        },

    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (entered) {
    if (!this.password) return false;
    return await bcrypt.compare(entered, this.password);
};

export default mongoose.model("User", userSchema);
