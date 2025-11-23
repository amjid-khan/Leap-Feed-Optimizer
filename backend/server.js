import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from "./routes/authRoutes.js";
import merchantRoutes from "./routes/merchantRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors"; // <-- import cors

dotenv.config();
const app = express();

// Middleware
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: "http://localhost:5173", // allow your frontend origin
    credentials: true,               // optional: if you want cookies
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/products", productRoutes);

connectDB();

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
