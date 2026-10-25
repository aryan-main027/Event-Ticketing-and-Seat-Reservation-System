
import bcrypt from "bcrypt";
import pool from "../db/pool.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !["ORGANIZER", "ATTENDEE"].includes(role)) {
      return res.status(400).json({ success: false, error: "name, email, password and a valid role are required" });
    }

    // UPDATED: the backend must enforce the password length too. The form's minLength={8}
    // is only a convenience, since anyone can call the API directly and skip the form.
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
    }

    const isExistingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (isExistingUser.rows.length > 0) {
      return res.status(409).json({ success: false, error: "User already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await pool.query(
      "INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email",
      [name, email, password_hash, role]
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: user.rows[0],
    });
  } catch (err) {
    // UPDATED: two simultaneous registrations with the same email can both pass the
    // check above. The UNIQUE constraint then rejects the second one (error 23505),
    // and we answer 409 instead of a confusing 500.
    if (err.code === "23505") {
      return res.status(409).json({ success: false, error: "User already exists" });
    }
    console.error("register failed:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const login = async (req,res) => {

  try{
    const {email , password} = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "email and password are required" });
    }
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if(result.rows.length === 0){
      return res.status(401).json({ success: false, error: "Credentials do not match" });
    }

    const user = result.rows[0];

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if(!isPasswordMatch){
      return res.status(401).json({ success: false, error: "Credentials do not match" });
    }

    const token = jwt.sign(
      { id : user.id , role : user.role},
      process.env.JWT_SECRET,
      {expiresIn : "1h"}
    )

    res.cookie("token", token, {
      httpOnly: true,                                  // JavaScript cannot read it (XSS defence)
      sameSite: "lax",                                 // not sent on cross-site POSTs (CSRF defence)
      secure: process.env.NODE_ENV === "production",   // HTTPS only in production
      maxAge: 60 * 60 * 1000                           // 1 hour, matches the JWT expiry
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error("login failed:", err); 
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

export const logout = (req, res) => {
  // options must match the ones used in res.cookie, or the browser keeps the cookie
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return res.status(200).json({ success: true, message: "Logged out" });
};

export const me = async (req,res) => {
  try{
    const {id} = req.user;

    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [id]  
    )

    if(result.rows.length === 0){
      return res.status(401).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({ success: true, user: result.rows[0] });
  }catch(err){
    console.error("me failed:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}