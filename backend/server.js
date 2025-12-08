import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from "./routes/authRoutes.js";
<<<<<<< HEAD
=======

>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";                   // <-- import passport
import setupPassport from "./config/passport.js";  // <-- import setupPassport
import googleAuthRoutes from "./routes/googleAuthRoutes.js"; // <-- Google routes
import productRoutes from "./routes/productRoutes.js"; // <-- Product routes

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();  // <-- app MUST be defined BEFORE app.use()

// Middleware
app.use(express.json());

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
    : ["http://localhost:5173"];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

// Passport setup
setupPassport();
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);       // existing email/password auth
app.use("/api/auth", googleAuthRoutes); // Google OAuth
<<<<<<< HEAD
app.use("/api/merchant", productRoutes);
=======
<<<<<<< HEAD
=======

>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
>>>>>>> 9a63498cae85895e3c7140e9873c10b0919bc660

// Connect to MongoDB
connectDB();

// Start server
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
