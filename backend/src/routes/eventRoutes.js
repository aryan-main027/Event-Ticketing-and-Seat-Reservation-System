import express from "express";
import { createEvent , getEvents , getEventById , updateEvent } from "../controllers/eventController.js";
import { authenticate, authorizeRole } from "../middleware/auth.js";
import tierRoutes from "./tiersRoutes.js";

const router = express.Router();

router.post("/", authenticate, authorizeRole("ORGANIZER"), createEvent);

router.get("/:id", getEventById);

router.get("/",getEvents);

router.patch("/:id",authenticate, authorizeRole("ORGANIZER"),updateEvent);

router.use("/:eventId/ticket_tiers", tierRoutes);

export default router;