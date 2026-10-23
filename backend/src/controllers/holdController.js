import pool from "../db/pool.js";

export const createHold = async (req, res) => {
  const { tier_id, quantity } = req.body;
  const user_id = req.user.id;

  // Validate input shape before borrowing a connection
  if (!Number.isInteger(tier_id) || tier_id <= 0) {
    return res.status(400).json({ success: false, error: "Invalid tier_id" });
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ success: false, error: "Quantity must be a positive integer" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock ONLY the tier row (FOR UPDATE OF t), but read the event's status too
    const tierResult = await client.query(
      `SELECT t.available_quantity, e.status AS event_status, e.start_at
       FROM ticket_tiers t
       JOIN events e ON e.id = t.event_id
       WHERE t.id = $1
       FOR UPDATE OF t`,
      [tier_id]
    );

    if (tierResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Tier not found" });
    }

    const tier = tierResult.rows[0];

    // Draft events are hidden from the public, so treat them as nonexistent
    if (tier.event_status === "draft") {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Tier not found" });
    }

    // Cancelled or already started: the event exists but isn't bookable
    if (tier.event_status === "cancelled" || new Date(tier.start_at) <= new Date()) {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, error: "This event is not open for booking" });
    }

    if (tier.available_quantity < quantity) {
      await client.query("ROLLBACK");
      return res.status(409).json({ success: false, error: "Not enough tickets available" });
    }

    await client.query(
      "UPDATE ticket_tiers SET available_quantity = available_quantity - $1, updated_at = NOW() WHERE id = $2",
      [quantity, tier_id]
    );

    const holdResult = await client.query(
      "INSERT INTO holds (user_id, tier_id, quantity, expiry_time) VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes') RETURNING *",
      [user_id, tier_id, quantity]
    );

    await client.query("COMMIT");
    return res.status(201).json({ success: true, hold: holdResult.rows[0] });

  } catch (err) {
    console.error("createHold failed:", err);
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("ROLLBACK failed:", rollbackErr);
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getMyHolds = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit);
    limit = (!limit || limit <= 0) ? 10 : limit;
    limit = (limit > 20) ? 20 : limit;

    let page = parseInt(req.query.page);
    if (!page || page <= 0) page = 1;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      "SELECT *, (expiry_time > NOW()) AS in_time FROM holds WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [req.user.id, limit, offset]
    );

    return res.status(200).json({
      success: true,
      holds: result.rows
    });
  } catch (err) {
    console.error("getMyHolds failed:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const getMyHoldById = async (req, res) => {
  try{
    const id = Number(req.params.id);

    if(!Number.isInteger(id) || id <= 0){
      return res.status(400).json({ success: false, error: "Invalid hold ID" });
    }

    const result = await pool.query(
      "SELECT *, (expiry_time > NOW()) AS in_time FROM holds WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Hold not found" });
    }


    return res.status(200).json({ success: true, hold: result.rows[0] });

  }catch(err){
    console.error("getMyHoldById failed:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};
