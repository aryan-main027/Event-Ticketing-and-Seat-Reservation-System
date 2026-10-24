import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/authRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import holdRoutes from "./src/routes/holdRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import { requireCustomHeader } from "./src/middleware/csrf.js";

const app = express();

app.use(helmet());
// UPDATED: credentials: true lets the browser send and store the cookie
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: () => process.env.NODE_ENV === "test",
  message: { success: false, error: "Too many attempts, try again later" }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  skip: () => process.env.NODE_ENV === "test",
  message: { success: false, error: "Too many requests, slow down" }
});

app.use(express.json());
app.use(cookieParser());
app.use(requireCustomHeader);

app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

app.use("/auth", authLimiter, authRoutes);
app.use("/events", generalLimiter, eventRoutes);
app.use("/holds", generalLimiter, holdRoutes);
app.use("/bookings", generalLimiter, bookingRoutes);

export default app;