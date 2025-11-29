import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createOrUpdateEmailMapping,
    getEmailMapping,
    getAllEmailMappings,
} from "../controllers/emailMappingController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/", createOrUpdateEmailMapping);
router.get("/", getAllEmailMappings);
router.get("/:email", getEmailMapping);

export default router;



