import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import app from "../app.js";
import pool from "../src/db/pool.js";

test("GET /health returns OK", async () => {
  const res = await request(app).get("/health");
  assert.strictEqual(res.status, 200);
});

test.after(async () => {
  await pool.end();
});