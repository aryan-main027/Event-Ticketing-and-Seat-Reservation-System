import dotenv from "dotenv";
import pool from "./src/db/pool.js";
import app from "./app.js";
import "./src/jobs/expireHolds.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected successfully");
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1);
  }
}

startServer();