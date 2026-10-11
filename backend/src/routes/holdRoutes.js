import express from "express";
import { createHold , getMyHolds} from "../controllers/holdController.js";
import { authenticate, authorizeRole } from "../middleware/auth.js";

const router = express.Router();
router.post("/", authenticate, authorizeRole("ATTENDEE"), createHold);

router.get("/", authenticate, authorizeRole("ATTENDEE"), getMyHolds)
export default router;