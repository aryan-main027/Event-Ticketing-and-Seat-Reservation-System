import express from "express";

import { createTier, getTiers} from "../controllers/tierController.js";
import { authenticate, authorizeRole } from "../middleware/auth.js";
const router = express.Router({ mergeParams: true });

router.post("/", authenticate, authorizeRole("ORGANIZER"), createTier);

router.get("/", getTiers);

export default router;
