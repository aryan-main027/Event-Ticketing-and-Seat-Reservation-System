import pool from "../db/pool.js";

export const confirmBooking = async (req, res) => {
  const { hold_id } = req.body;
  const user_id = req.user.id;

  // Validate input shape before borrowing a connection
  if (!Number.isInteger(hold_id) || hold_id <= 0) {
    // UPDATED: added success: false to match the agreed error format
    return res.status(400).json({ success: false, error: "Invalid hold_id" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // UPDATED: the query now joins ticket_tiers and events, so we can also check
    // that the event is still open. FOR UPDATE OF h locks ONLY the hold row.
    // All time comparisons use the database clock (NOW()), not Node's.
    const holdResult = await client.query(
      `SELECT h.*,
              (h.expiry_time > NOW()) AS in_time,
              (e.start_at > NOW())    AS event_open,
              e.status                AS event_status
       FROM holds h
       JOIN ticket_tiers t ON t.id = h.tier_id
       JOIN events e ON e.id = t.event_id
       WHERE h.id = $1
       FOR UPDATE OF h`,
      [hold_id]
    );

    if (holdResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Hold not found" });
    }

    const hold = holdResult.rows[0];

    // UPDATED: returns 404 instead of 403 when the hold belongs to someone else.
    // Ids are guessable integers, so a 403 would confirm which hold ids exist.
    // This matches getMyHoldById. (Revert to 403 if you prefer.)
    if (hold.user_id !== user_id) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Hold not found" });
    }

    if (hold.status !== "active") {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, error: "This hold is not active" });
    }

    if (!hold.in_time) {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, error: "This hold has expired" });
    }

    // UPDATED: new check. A hold lasts 10 minutes, but the event may have been
    // cancelled or may have started in the meantime.
    if (hold.event_status === "cancelled" || !hold.event_open) {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, error: "This event is no longer open for booking" });
    }

    // tier_id and quantity come from the locked hold row, never from the client
    const bookingResult = await client.query(
      "INSERT INTO bookings (user_id, tier_id, hold_id, quantity) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, hold.tier_id, hold.id, hold.quantity]
    );

    await client.query("UPDATE holds SET status = 'converted' WHERE id = $1", [hold.id]);

    await client.query("COMMIT");

    // UPDATED: added success: true to match the agreed response format
    return res.status(201).json({ success: true, booking: bookingResult.rows[0] });
  } catch (err) {
    console.error("confirmBooking failed:", err);
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("ROLLBACK failed:", rollbackErr);
    }
    // UPDATED: added success: false
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getMyBookings = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit);
    limit = (!limit || limit <= 0) ? 10 : limit;
    limit = (limit > 20) ? 20 : limit;

    let page = parseInt(req.query.page);
    if (!page || page <= 0) page = 1;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT b.*, t.name AS tier_name, t.price,
              e.name AS event_name, e.start_at AS event_start_at, e.venue AS event_venue
       FROM bookings b
       JOIN ticket_tiers t ON b.tier_id = t.id
       JOIN events e ON t.event_id = e.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.status(200).json({ success: true, bookings: result.rows });
  } catch (err) {
    console.error("getMyBookings failed:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const getMyBookingById = async (req,res) => {
  try{
    const userid = req.user.id;

    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, error: "Invalid booking id" });
    }

    const result = await pool.query(
      "Select b.*, t.name AS tier_name, t.price AS tier_price, e.name AS event_name, e.start_at AS event_start_at, e.venue AS event_venue FROM bookings b JOIN ticket_tiers t ON b.tier_id = t.id JOIN events e ON t.event_id = e.id WHERE b.user_id = $1 AND b.id = $2", 
      [userid, bookingId]
    )


    if(result.rows.length === 0){
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    return res.status(200).json({ success: true, booking: result.rows[0] });
  }
  catch(err){
    console.error("getMyBookingById failed:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
