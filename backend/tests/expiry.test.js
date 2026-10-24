import request from "supertest";
import { jest } from "@jest/globals";
import app from "../app.js";
import pool from "../src/db/pool.js";
import { expireHolds } from "../src/jobs/expireHolds.js";
import { resetDb, registerAndLogin, createPublishedEvent, createTier } from "./helpers.js";

jest.setTimeout(30000);

afterAll(async () => {
  await pool.end();
});

// the parameter is now the cookie, and it is actually used
async function createHold(cookie, tierId, quantity) {
  const res = await request(app)
    .post("/holds")
    .set("Cookie", cookie)
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ tier_id: tierId, quantity });
  expect(res.status).toBe(201);
  return res.body.hold;
}

async function confirmHold(cookie, holdId) {
  return request(app)
    .post("/bookings")
    .set("Cookie", cookie)
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ hold_id: holdId });
}

async function makeExpired(holdId) {
  await pool.query(
    "UPDATE holds SET expiry_time = NOW() - INTERVAL '1 minute' WHERE id = $1",
    [holdId]
  );
}

async function setup(total) {
  await resetDb();
  const organizer = await registerAndLogin("ORGANIZER");
  const attendee = await registerAndLogin("ATTENDEE");
  const event = await createPublishedEvent(organizer.cookie);
  const tier = await createTier(organizer.cookie, event.id, total);
  return { attendee, tier };
}

test("expired hold is released and tickets return to the tier", async () => {
  const { attendee, tier } = await setup(10);

  const hold = await createHold(attendee.cookie, tier.id, 3);
  await makeExpired(hold.id);

  await expireHolds();

  const holdRow = await pool.query("SELECT status FROM holds WHERE id = $1", [hold.id]);
  expect(holdRow.rows[0].status).toBe("expired");

  const tierRow = await pool.query("SELECT available_quantity FROM ticket_tiers WHERE id = $1", [tier.id]);
  expect(tierRow.rows[0].available_quantity).toBe(10);
});

test("converted hold is NOT released by the cron job", async () => {
  const { attendee, tier } = await setup(10);

  const hold = await createHold(attendee.cookie, tier.id, 3);
  const confirm = await confirmHold(attendee.cookie, hold.id);
  expect(confirm.status).toBe(201);

  await makeExpired(hold.id);   // time passes after the booking
  await expireHolds();

  const holdRow = await pool.query("SELECT status FROM holds WHERE id = $1", [hold.id]);
  expect(holdRow.rows[0].status).toBe("converted");

  const tierRow = await pool.query("SELECT available_quantity FROM ticket_tiers WHERE id = $1", [tier.id]);
  expect(tierRow.rows[0].available_quantity).toBe(7);   // 10 - 3, NOT returned
});

test("confirming an expired hold is rejected even before cron runs", async () => {
  const { attendee, tier } = await setup(10);

  const hold = await createHold(attendee.cookie, tier.id, 2);
  await makeExpired(hold.id);   // status is still 'active', time has run out

  const confirm = await confirmHold(attendee.cookie, hold.id);
  expect(confirm.status).toBe(409);
});