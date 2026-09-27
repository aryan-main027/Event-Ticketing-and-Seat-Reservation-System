import express from "express";
import dotenv from "dotenv";
import pool from "./src/db/pool.js";
import bcrypt from "bcrypt";
import authRoutes from "./src/routes/authRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";


dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("/auth",authRoutes);
app.use("/events", eventRoutes);

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