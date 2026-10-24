import request from "supertest";
import { jest } from "@jest/globals";
import app from "../app.js";
import pool from "../src/db/pool.js";
import { resetDb, registerAndLogin, createPublishedEvent, createTier } from "./helpers.js";

jest.setTimeout(30000);

afterAll(async () => {
  await pool.end();
});

test("available + active holds + booked always equals total", async () => {
  await resetDb();

  const organizer = await registerAndLogin("ORGANIZER");
  const attendee = await registerAndLogin("ATTENDEE");
  // UPDATED: .token became .cookie
  const event = await createPublishedEvent(organizer.cookie);
  const tier = await createTier(organizer.cookie, event.id, 10);

  const holdResults = await Promise.all(
    Array.from({ length: 15 }, (_, i) =>
      request(app)
        .post("/holds")
        .set("Cookie", attendee.cookie)
        .set("X-Requested-With", "XMLHttpRequest")
        .send({ tier_id: tier.id, quantity: (i % 2) + 1 })
    )
  );

  const created = holdResults.filter((r) => r.status === 201);
  expect(created.length).toBeGreaterThan(0);

  for (const res of created.slice(0, 2)) {
    const confirmRes = await request(app)
      .post("/bookings")
      .set("Cookie", attendee.cookie)
      .set("X-Requested-With", "XMLHttpRequest")
      .send({ hold_id: res.body.hold.id });
    expect(confirmRes.status).toBe(201);
  }

  const { rows } = await pool.query(
    `SELECT t.total_quantity,
            t.available_quantity
            + COALESCE((SELECT SUM(quantity) FROM holds WHERE tier_id = t.id AND status = 'active'), 0)
            + COALESCE((SELECT SUM(quantity) FROM bookings WHERE tier_id = t.id), 0) AS accounted
     FROM ticket_tiers t
     WHERE t.id = $1`,
    [tier.id]
  );

  expect(Number(rows[0].accounted)).toBe(rows[0].total_quantity);
});