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
            required: function () {
                // Password is optional when user signs in with Google
                return !this.googleId;
            },
        },
        selectedAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null,
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        googlePicture: {
            type: String,
        },
        googleAccessToken: {
            type: String,
        },
        googleRefreshToken: {
            type: String,
        },
        googleTokenExpiry: {
            type: Date,
        },
        googleScopes: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);


// Password Hash
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});


// Compare Password Method
userSchema.methods.comparePassword = async function (entered) {
    if (!this.password) return false;
    return await bcrypt.compare(entered, this.password);
};


export default mongoose.model("User", userSchema);