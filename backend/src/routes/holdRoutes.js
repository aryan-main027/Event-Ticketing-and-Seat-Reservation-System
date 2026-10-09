import express from "express";
import { createHold } from "../controllers/holdController.js";
import { authenticate, authorizeRole } from "../middleware/auth.js";

const router = express.Router();
router.post("/", authenticate, authorizeRole("ATTENDEE"), createHold);

export default router;