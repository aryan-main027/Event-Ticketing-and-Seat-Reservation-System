import express from "express";
import { confirmBooking } from "../controllers/bookingController.js";
import { authenticate, authorizeRole } from "../middleware/auth.js";

const router = express.Router();
router.post("/", authenticate, authorizeRole("ATTENDEE"), confirmBooking);

export default router;