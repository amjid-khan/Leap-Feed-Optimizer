import express from "express";
import { registerUser, loginUser, getAllUsers, verifyToken } from "../controllers/authController.js";

const router = express.Router();

// Basic email/password auth only
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", getAllUsers);
router.get("/verify", verifyToken);

export default router;