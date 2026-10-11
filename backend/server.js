import express from "express";
import dotenv from "dotenv";
import pool from "./src/db/pool.js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./src/routes/authRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import holdRoutes from "./src/routes/holdRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import "./src/jobs/expireHolds.js";

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,                  // 10 requests per window per IP
  message: { success: false, error: "Too many attempts, try again later" }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  limit: 100,                 // 100 requests per window per IP
  message: { success: false, error: "Too many requests, slow down" }
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("/auth", authLimiter, authRoutes);
app.use("/events", generalLimiter, eventRoutes);
app.use("/holds", generalLimiter, holdRoutes);
app.use("/bookings", generalLimiter, bookingRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await pool.query("SELECT 1");

    console.log("Database connected successfully");

    app.listen(PORT, () => {
      
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1);
  }
}

startServer();