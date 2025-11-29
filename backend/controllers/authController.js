import User from "../models/User.js";
import { generateToken } from "../utils/token.js";
import jwt from "jsonwebtoken";

const formatUserResponse = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    image: user.googlePicture || null, // Map googlePicture to image for frontend
    selectedAccount: user.selectedAccount || null,
});

// REGISTER
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ message: "All fields required" });

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "Email already exists" });

        const user = await User.create({ name, email, password, role: "user" });

        res.status(201).json({
            message: "User Registered",
            user: formatUserResponse(user),
            token: generateToken(user._id),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// LOGIN
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;


        if (!email || !password)
            return res.status(400).json({ message: "All fields required" });


        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid Credentials" });


        const match = await user.comparePassword(password);
        if (!match) return res.status(400).json({ message: "Invalid Credentials" });


        res.json({
            message: "Login Successful",
            user: formatUserResponse(user),
            token: generateToken(user._id),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find(); // assuming you have a User model
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// VERIFY TOKEN
export const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith("Bearer") 
            ? authHeader.split(" ")[1] 
            : null;
        
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            user: formatUserResponse(user),
        });
    } catch (err) {
        res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};