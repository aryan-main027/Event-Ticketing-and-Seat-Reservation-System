
import pool from "../db/pool.js";

export const createTier = async (req,res) => {
  try{
    const {eventId} = req.params;

    const eventResult = await pool.query(
      "SELECT * FROM events WHERE id = $1",
      [eventId]
    );

    if(eventResult.rows.length === 0){
      return res.status(404).json({
        error: "Event not found"
      });
    }

    const event = eventResult.rows[0];

    if(event.organizer_id !== req.user.id){
      return res.status(403).json({
        error: "You are not authorized to create a tier for this event"
      });
    }

    const {name, price, total_quantity} = req.body;

    if(!name || !price || !total_quantity){
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const available_quantity = total_quantity;

    const result = await pool.query(
      "INSERT INTO ticket_tiers (event_id, name, price, total_quantity, available_quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [eventId, name, price, total_quantity, available_quantity]
    );

    return res.status(201).json({
      success: true,
      message: "Tier created successfully",
      tier: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating tier:", error);
    return res.status(500).json({
      error: "Internal server error"
    })
  }
}

export const getTiers = async (req,res) => {
  try{
    const {eventId} = req.params;

    const eventResult = await pool.query(
      "SELECT * FROM events WHERE id = $1",
      [eventId]
    );

    if(eventResult.rows.length === 0){
      return res.status(404).json({
        error: "Event not found"
      });
    }

    const tiersResult = await pool.query(
      "SELECT * FROM ticket_tiers WHERE event_id = $1",
      [eventId]
    );

    return res.status(200).json({
      success: true,
      tiers: tiersResult.rows
    });
  }catch(err){
    return res.status(500).json({
      error: "Internal server error"
    })
  }
}