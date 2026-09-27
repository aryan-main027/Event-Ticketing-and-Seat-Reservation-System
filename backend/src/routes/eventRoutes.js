import express from "express";
import { createEvent } from "../controllers/eventController.js";
import { authenticate, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticate, authorizeRole("ORGANIZER"), createEvent);

export default router;