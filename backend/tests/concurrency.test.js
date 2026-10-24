
import { jest } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import pool from "../src/db/pool.js";
import {
  resetDb,
  registerAndLogin,
  createPublishedEvent,
  createTier,
} from "./helpers.js";

jest.setTimeout(30000);

afterAll(async () => {
  // Existing cleanup. If this still times out after the fix,
  // investigate outstanding database connections separately.
  await pool.end();
});

test("20 simultaneous holds on a 5-ticket tier: exactly 5 succeed", async () => {
  await resetDb();

  const organizer = await registerAndLogin("ORGANIZER");
  const attendee = await registerAndLogin("ATTENDEE");

  const event = await createPublishedEvent(organizer.token);
  const tier = await createTier(organizer.token, event.id, 5);

  // CHANGE 1: Restore 20 concurrent requests, not 1.
  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      request(app)
        .post("/holds")
        .set("Authorization", `Bearer ${attendee.token}`)
        .send({ tier_id: tier.id, quantity: 1 })
    )
  );

  const statuses = results.map((r) => r.status);

  // CHANGE 2: The original concurrency expectations apply to 20 requests.
  expect(results).toHaveLength(20);
  expect(statuses.filter((s) => s === 201)).toHaveLength(5);
  expect(statuses.filter((s) => s === 409)).toHaveLength(15);

  // Verify actual remaining inventory.
  const { rows } = await pool.query(
    "SELECT available_quantity FROM ticket_tiers WHERE id = $1",
    [tier.id]
  );

  expect(rows[0].available_quantity).toBe(0);

  // Verify exactly five active holds exist.
  const holds = await pool.query(
    `SELECT COUNT(*)::int AS n
     FROM holds
     WHERE tier_id = $1 AND status = 'active'`,
    [tier.id]
  );

  expect(holds.rows[0].n).toBe(5);
});
