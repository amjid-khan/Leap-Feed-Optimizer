import User from "../models/User.js";
import { fetchGoogleMerchantProducts } from "../services/googleMerchantService.js";

export const getMerchantProducts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const merchantId = user.selectedAccount;

        if (!merchantId) {
            return res.status(400).json({ error: "No merchant account selected" });
        }

        const products = await fetchGoogleMerchantProducts(user, merchantId);

        return res.json({
            merchantId,
            total: products.length,
            products
        });

    } catch (error) {
        console.error("Error fetching products:", error.message);
        res.status(500).json({ error: "Failed to fetch products" });
    }
};
