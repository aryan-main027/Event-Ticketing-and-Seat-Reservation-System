
import pool from "../db/pool.js";

// CHANGE 1: Fix connection handling inside createHold.
export const createHold = async (req, res) => {
  const { tier_id, quantity } = req.body;
  const user_id = req.user.id;

  // Validate before borrowing a database connection
  if (!Number.isInteger(tier_id) || tier_id <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid tier_id",
    });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      success: false,
      error: "Quantity must be a positive integer",
    });
  }

  // CHANGE 2: Declare client OUTSIDE try.
  // catch and finally must be able to access it.
  let client;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    // Lock the tier row so concurrent holds cannot oversell it.
    const tierResult = await client.query(
      `SELECT
         t.available_quantity,
         e.status AS event_status,
         (e.start_at <= NOW()) AS started
       FROM ticket_tiers t
       JOIN events e ON e.id = t.event_id
       WHERE t.id = $1
       FOR UPDATE OF t`,
      [tier_id]
    );

    if (tierResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        error: "Tier not found",
      });
    }

    const tier = tierResult.rows[0];

    if (tier.event_status === "draft") {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        error: "Tier not found",
      });
    }

    if (
      tier.event_status === "cancelled" || tier.started) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        error: "This event is not open for booking",
      });
    }

    if (tier.available_quantity < quantity) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        error: "Not enough tickets available",
      });
    }

    await client.query(
      `UPDATE ticket_tiers
       SET available_quantity = available_quantity - $1,
           updated_at = NOW()
       WHERE id = $2`,
      [quantity, tier_id]
    );

    const holdResult = await client.query(
      `INSERT INTO holds
         (user_id, tier_id, quantity, expiry_time)
       VALUES
         ($1, $2, $3, NOW() + INTERVAL '10 minutes')
       RETURNING *`,
      [user_id, tier_id, quantity]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      hold: holdResult.rows[0],
    });
  } catch (err) {
    console.error("createHold failed:", err);

    // CHANGE 3: Roll back only if a connection was acquired.
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("ROLLBACK failed:", rollbackErr);
      }
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  } finally {
    // CHANGE 4: Always release an acquired connection.
    // This also runs when the function returns early.
    if (client) {
      client.release();
    }
  }
};

export const getMyHolds = async (req, res) => {
  try {
    // Existing pagination logic retained
    let limit = parseInt(req.query.limit, 10);
    limit = !limit || limit <= 0 ? 10 : limit;
    limit = limit > 20 ? 20 : limit;

    let page = parseInt(req.query.page, 10);
    if (!page || page <= 0) page = 1;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT h.*, (h.expiry_time > NOW()) AS in_time,
              t.name AS tier_name, e.name AS event_name
      FROM holds h
      JOIN ticket_tiers t ON t.id = h.tier_id
      JOIN events e ON e.id = t.event_id
      WHERE h.user_id = $1
      ORDER BY h.created_at DESC
      LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.status(200).json({
      success: true,
      holds: result.rows,
    });
  } catch (err) {
    console.error("getMyHolds failed:", err);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getMyHoldById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid hold ID",
      });
    }

    const result = await pool.query(
      `SELECT *,
              (expiry_time > NOW()) AS in_time
       FROM holds
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Hold not found",
      });
    }

    return res.status(200).json({
      success: true,
      hold: result.rows[0],
    });
  } catch (err) {
    console.error("getMyHoldById failed:", err);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
