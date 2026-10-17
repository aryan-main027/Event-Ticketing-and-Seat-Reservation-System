import express from "express";
import { createHold , getMyHolds , getMyHoldById} from "../controllers/holdController.js";
import { authenticate, authorizeRole } from "../middleware/auth.js";

const router = express.Router();
router.post("/", authenticate, authorizeRole("ATTENDEE"), createHold);

router.get("/", authenticate, authorizeRole("ATTENDEE"), getMyHolds);

router.get("/:id", authenticate, authorizeRole("ATTENDEE"), getMyHoldById);

export default router;