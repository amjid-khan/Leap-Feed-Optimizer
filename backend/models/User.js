import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: 2,
        },
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
            // ✅ Required only if googleId is not present
            required: function () { return !this.googleId; },
        },
        googleId: {
            type: String, // optional for Google OAuth
        },
        selectedAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null,
        },
    },
    { timestamps: true }
);

// Password Hash
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    if (this.password) { // hash only if password exists
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Compare Password Method
userSchema.methods.comparePassword = async function (entered) {
    if (!this.password) return false;
    return await bcrypt.compare(entered, this.password);
};

export default mongoose.model("User", userSchema);
