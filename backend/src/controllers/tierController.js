import pool from "../db/pool.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createTier = async (req, res) => {
  try {
    const eventId = parseId(req.params.eventId);
    if (!eventId) {
      return res.status(400).json({ success: false, error: "Invalid event id" });
    }

    const { name, price, total_quantity } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ success: false, error: "name is required" });
    }
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({ success: false, error: "price must be a number, 0 or more" });
    }
    if (!Number.isInteger(total_quantity) || total_quantity <= 0) {
      return res.status(400).json({ success: false, error: "total_quantity must be a positive integer" });
    }

    const eventResult = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    const event = eventResult.rows[0];

    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({ success: false, error: "You are not authorized to create a tier for this event" });
    }

    if (event.status === "cancelled") {
      return res.status(409).json({ success: false, error: "Cannot add tiers to a cancelled event" });
    }

    const result = await pool.query(
      "INSERT INTO ticket_tiers (event_id, name, price, total_quantity, available_quantity) VALUES ($1, $2, $3, $4, $4) RETURNING *",
      [eventId, name, price, total_quantity]
    );

    return res.status(201).json({
      success: true,
      message: "Tier created successfully",
      tier: result.rows[0]
    });
  } catch (err) {
    console.error("createTier failed:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const getTiers = async (req, res) => {
  try {
    const eventId = parseId(req.params.eventId);
    if (!eventId) {
      return res.status(400).json({ success: false, error: "Invalid event id" });
    }

    const eventResult = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);

    // Drafts are hidden from everyone except their owner
    const event = eventResult.rows[0];
    const isOwner = req.user && event && event.organizer_id === req.user.id;

    if (!event || (event.status === "draft" && !isOwner)) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    const tiersResult = await pool.query(
      "SELECT * FROM ticket_tiers WHERE event_id = $1 ORDER BY id",
      [eventId]
    );

    return res.status(200).json({ success: true, tiers: tiersResult.rows });
  } catch (err) {
    console.error("getTiers failed:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};