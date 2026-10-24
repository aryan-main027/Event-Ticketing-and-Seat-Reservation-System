// import cron from "node-cron";
import pool from "../db/pool.js";

export const expireHolds = async () => {
  try {
    // Only ids are needed here; LIMIT stops a huge backlog loading at once
    const holdResult = await pool.query(
      `SELECT id FROM holds
       WHERE status = 'active' AND expiry_time <= NOW()
       ORDER BY expiry_time
       LIMIT 100`
    );

    for (const { id } of holdResult.rows) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Lock the hold and re-check it, in case confirmBooking got there first
        const recheckResult = await client.query(
          `SELECT id, tier_id, quantity FROM holds
           WHERE id = $1 AND status = 'active' AND expiry_time <= NOW()
           FOR UPDATE`,
          [id]
        );

        if (recheckResult.rows.length === 0) {
          await client.query("ROLLBACK");
          continue; // finally still releases the client
        }

        // Use the values from the locked row, not from the first read
        const locked = recheckResult.rows[0];

        await client.query(
          "UPDATE holds SET status = 'expired' WHERE id = $1",
          [locked.id]
        );

        await client.query(
          `UPDATE ticket_tiers
           SET available_quantity = available_quantity + $1, updated_at = NOW()
           WHERE id = $2`,
          [locked.quantity, locked.tier_id]
        );

        await client.query("COMMIT");
      } catch (err) {
        console.error(`Error processing hold ${id}:`, err);
        try {
          await client.query("ROLLBACK");
        } catch (e) {
          console.error("ROLLBACK failed:", e);
        }
      } finally {
        client.release();
      }
    }
  } catch (err) {
    console.error("expireHolds failed:", err);
  }
};

// // every 30 seconds
// cron.schedule("*/30 * * * * *", expireHolds);