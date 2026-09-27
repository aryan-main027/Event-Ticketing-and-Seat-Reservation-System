import pool from "../db/pool.js";

export const createEvent = async (req,res) => {
  try{
    const {name,start_at,description,venue} = req.body;

    if(!name || !start_at || !venue){
      return res.status(400).json({ error: "All fields are required" });
    }

    const organizer_id = req.user.id; 

    const newEvent = await pool.query("INSERT INTO events (name, start_at, description, venue, organizer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *", [name, start_at, description, venue, organizer_id]);

    return res.status(201).json(
      { message: "Event created successfully", event: newEvent.rows[0] }
    );
  }catch(err){
    return res.status(500).json(
      { error: "Internal server error" }
    );
  }
}