import optimizeService from "../services/optimizeService.js";
import merchantService from "../services/merchantService.js";

const productController = {
    // Real product optimization
    optimizeProduct: async (req, res) => {
        try {
            const { productId } = req.params;

            const allProducts = (await merchantService.getProducts()).products;
            const productData = allProducts.find(p => p.id === productId);

            if (!productData) {
                return res.status(404).json({ message: "Product not found" });
            }

            const optimized = await optimizeService.optimizeTitleDescription(
                productData.title,
                productData.description
            );

            // Optional: Google Merchant me update
            // await merchantService.updateProduct(productId, optimized);

            res.json({
                success: true,
                original: { title: productData.title, description: productData.description },
                optimized
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Server Error", error: err.message });
        }
    },

    // ✅ Test route for Thunder Client
    testOptimize: async (req, res) => {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description required" });
        }

        try {
            const optimized = await optimizeService.optimizeTitleDescription(title, description);

            res.json({
                success: true,
                original: { title, description },
                optimized
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Test optimization failed", error: err.message });
        }
    }
};

export default productController;
