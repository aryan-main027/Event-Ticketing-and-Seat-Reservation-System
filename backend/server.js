import dotenv from "dotenv";
import pool from "./src/db/pool.js";
import app from "./app.js";
import cron from "node-cron";
import { expireHolds } from "./src/jobs/expireHolds.js";
// import "./src/jobs/expireHolds.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected successfully");
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    cron.schedule("*/30 * * * * *", expireHolds);
  } catch (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1);
  }
}

startServer();