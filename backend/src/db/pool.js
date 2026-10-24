import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = 
  process.env.NODE_ENV === "test" 
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: connectionString,
});

export default pool;