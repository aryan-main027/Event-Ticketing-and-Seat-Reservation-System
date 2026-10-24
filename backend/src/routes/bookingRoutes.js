import express from "express";
import { confirmBooking , getMyBooking , getMyBookingById} from "../controllers/bookingController.js";
import { authenticate, authorizeRole } from "../middleware/auth.js";

const router = express.Router();
router.post("/", authenticate, authorizeRole("ATTENDEE"), confirmBooking);

router.get("/", authenticate, authorizeRole("ATTENDEE"), getMyBooking);
router.get("/:id", authenticate, authorizeRole("ATTENDEE"), getMyBookingById);

export default router;