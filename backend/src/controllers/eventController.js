import pool from "../db/pool.js";


const EVENT_STATUSES = ["draft", "published", "cancelled"];


export const createEvent = async (req,res) => {
  try{
    const {name,start_at,description,venue} = req.body;

    if(!name || !start_at || !venue){
      return res.status(400).json({ success: false, error: "Name, start date, and venue are required" });
    }

    // Validate start_at is a valid date
    if (isNaN(new Date(start_at).getTime())) {
      return res.status(400).json({ success: false, error: "start_at must be a valid date" });
    }

    // Check if start_at is in the future
    if (new Date(start_at) <= new Date()) {
      return res.status(400).json({ success: false, error: "start_at must be in the future" });
    }

    const organizer_id = req.user.id; 

    const newEvent = await pool.query("INSERT INTO events (name, start_at, description, venue, organizer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *", [name, start_at, description, venue, organizer_id]);

    return res.status(201).json(
      { success: true, message: "Event created successfully", event: newEvent.rows[0] }
    );
  }catch(err){
    console.error("createEvent failed:", err);
    return res.status(500).json(
      { success: false, error: "Internal server error" }
    );
  }
}

export const getEvents = async (req,res) => {
  try{
    let limit = parseInt(req.query.limit);
    limit = (!limit || limit <= 0) ? 10 : limit;
    limit = (limit > 20) ? 20 : limit;

    let page = parseInt(req.query.page);
    if(!page || page <= 0) page = 1;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      "SELECT * FROM events WHERE status != 'draft' AND start_at > NOW() ORDER BY start_at ASC LIMIT $1 OFFSET $2",
      [limit, offset] 
    )

    return res.status(200).json({
      success: true,
      events : result.rows
    })
  }catch(err){
    console.error("getEvents failed:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    })
  }
}

export const getEventById = async (req,res) => {
  try{
    const {id} = req.params;

    if(!Number.isInteger(Number(id)) || Number(id) <= 0){
      return res.status(400).json({
        success: false,
        error: "Invalid event ID"
      });
    }

    const result = await pool.query(
      "SELECT * FROM events WHERE id = $1 AND status != 'draft'",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }

    return res.status(200).json({
      success: true,
      event: result.rows[0]
    });
  }catch(err){
    console.error("getEventById failed:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    })
  }
}

export const updateEvent = async (req,res) => {
  try{

    if(req.body.status !== undefined && !EVENT_STATUSES.includes(req.body.status)){
      return res.status(400).json({
        success: false,
        error: "Invalid event status"
      });
    }


    const {id} = req.params;

    if(!Number.isInteger(Number(id)) || Number(id) <= 0){
      return res.status(400).json({
        success: false,
        error: "Invalid event ID"
      });
    }

    if (req.body.start_at !== undefined && isNaN(new Date(req.body.start_at).getTime())) {
      return res.status(400).json({ success: false, error: "start_at must be a valid date" });
    }

    for (const key of ["name", "venue", "start_at"]) {
      const value = req.body[key];
      if (value !== undefined && (value === null || value === "")) {
        return res.status(400).json({ success: false, error: `${key} cannot be empty` });
      }
    }
    const eventResult = await pool.query(
      "SELECT * FROM events WHERE id = $1",
      [id]
    );

    if(eventResult.rows.length === 0){
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }

    const event = eventResult.rows[0];

    if(event.organizer_id !== req.user.id){
      return res.status(403).json({
        success: false,
        error: "You are not authorized to update this event"
      });
    }

    const allowedFields = ["name", "description", "venue", "start_at", "status"];
    const fields = [];
    const values = [];

    let index = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = $${index}`);
        values.push(req.body[field]);
        index++;
      }
    }

    if(fields.length === 0){
      return res.status(400).json({
        success: false,
        error: "No valid fields provided for update"
      })
    }

    values.push(id);

    const query = `UPDATE events SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${index} RETURNING *`;

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: result.rows[0]
    })

  }catch(err){
    console.error("updateEvent failed:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    })
  }
}