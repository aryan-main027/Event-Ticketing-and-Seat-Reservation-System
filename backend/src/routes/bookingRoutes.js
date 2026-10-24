import express from "express";
import { confirmBooking , getMyBookings , getMyBookingById} from "../controllers/bookingController.js";
import { authenticate, authorizeRole } from "../middleware/auth.js";

const router = express.Router();
router.post("/", authenticate, authorizeRole("ATTENDEE"), confirmBooking);

router.get("/", authenticate, authorizeRole("ATTENDEE"), getMyBookings);
router.get("/:id", authenticate, authorizeRole("ATTENDEE"), getMyBookingById);

export default router;