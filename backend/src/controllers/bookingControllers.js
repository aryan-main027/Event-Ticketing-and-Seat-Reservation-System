import pool from "../db/pool.js";

export const confirmBooking = async (req,res) => {
  const {hold_id} = req.body;
  const user_id = req.user.id;

  // 1. Validate the hold (>0)
  if (!Number.isInteger(hold_id) || hold_id <= 0) {
    return res.status(400).json({ error: "Invalid hold_id" });
  }

  const client = await pool.connect();

  try{
    await client.query("BEGIN");

    // 2. SELECT the hold FOR UPDATE, and also compute whether it is still in time:
    //    SELECT *, (expiry_time > NOW()) AS in_time FROM holds WHERE id = $1 FOR UPDATE
    //    (this way the database's clock decides, not Node's)

    const holdResult = await client.query(
      "SELECT *, (expiry_time > NOW()) AS in_time FROM holds WHERE id = $1 FOR UPDATE",
      [hold_id]
    );

    if (holdResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Hold not found" });
    }

    const hold = holdResult.rows[0];

    if(hold.user_id !== user_id){
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "You do not own this hold" });
    }

    if(hold.status !== 'active'){
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This hold is not active" });
    }

    if(!hold.in_time){
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This hold has expired" });
    }

    const bookingResult = await client.query(
      "INSERT INTO bookings (user_id, tier_id, hold_id, quantity) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, hold.tier_id, hold_id, hold.quantity]
    );

    await client.query("UPDATE holds SET status = 'converted' WHERE id = $1", [hold_id]);

    await client.query("COMMIT");
    
    return res.status(201).json({ booking: bookingResult.rows[0] });
  } catch (err) {
    console.error("confirmBooking failed:", err);
    try { await client.query("ROLLBACK"); } catch (e) { console.error("ROLLBACK failed:", e); }
    return res.status(500).json({ error: "Internal server error" });
  }finally{
    client.release();
  }
}

