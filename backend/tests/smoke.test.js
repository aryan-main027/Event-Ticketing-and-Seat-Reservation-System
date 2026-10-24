import request from "supertest";
import app from "../app.js";
import pool from "../src/db/pool.js";
import { jest } from "@jest/globals";

afterAll(async () => {
  await pool.end();
});

test("GET /health returns OK", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
});