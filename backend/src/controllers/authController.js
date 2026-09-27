import express from "express";
import bcrypt from "bcrypt";
import pool from "../db/pool.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


export const register = async (req,res) => {
  try{
    const {name,email,password,role} = req.body;

    const isExistingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if(isExistingUser.rows.length > 0){
      return res.status(409).json({
        message : "User alreday exists"
      });
    }

    // Continue with the registration process
    const password_hash = await bcrypt.hash(password, 10);

    const user = await pool.query("INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email",[name,email,password_hash,role]);

    return res.status(201).json({
      success : true,
      message : "User registered successfully",
      "user": {
          "id": user.rows[0].id,
          "name": user.rows[0].name,
          "email": user.rows[0].email
        }
    });
  }catch(err){
    res.status(500).json({
      success : false,
      message : "Internal server error",
      error : err.message
    });
  }
  
}

export const login = async (req,res) => {

  try{
    const {email , password} = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if(result.rows.length === 0){
      return res.status(401).json({
        success : false,
        message : "Credentials do not match"
      });
    }

    const user = result.rows[0];

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if(!isPasswordMatch){
      return res.status(401).json({
        success : false,
        message : "Credentials do not match"
      });
    }

    const token = jwt.sign(
      { id : user.id , role : user.role},
      process.env.JWT_SECRET,
      {expiresIn : "1h"}
    )

    return res.status(200).json({
      success : true,
      message : "Login successful",
      token : token,
      "user": {
          "id": user.id,
          "name": user.name,
          "email": user.email
        }
    });

  } catch (error) {
    res.status(500).json({
      success : false,
      message : "Internal server error",
      error : error.message
    });
  }
  
}
