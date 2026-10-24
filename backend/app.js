import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./src/routes/authRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import holdRoutes from "./src/routes/holdRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));

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

app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

app.use("/auth", authLimiter, authRoutes);
app.use("/events", generalLimiter, eventRoutes);
app.use("/holds", generalLimiter, holdRoutes);
app.use("/bookings", generalLimiter, bookingRoutes);

export default app;