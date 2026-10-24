import request from "supertest";
import app from "../app.js";
import pool from "../src/db/pool.js";

// Throws a readable error if a setup call didn't return the expected status
function expectStatus(res, expected, label) {
  if (res.status !== expected) {
    throw new Error(
      `${label} failed: expected ${expected}, got ${res.status} ${JSON.stringify(res.body)}`
    );
  }
}

// Empties every table and restarts the id counters
export async function resetDb() {
  // safety guard: never truncate anything except the test database
  if (process.env.NODE_ENV !== "test") {
    throw new Error("resetDb only runs in test mode");
  }
  await pool.query(
    "TRUNCATE bookings, holds, ticket_tiers, events, users RESTART IDENTITY CASCADE"
  );
}

// Registers a user through the real API, logs in, returns { cookie, id }
export async function registerAndLogin(role) {
  // unique email each time, since emails must be unique
  const email = `${role.toLowerCase()}-${Date.now()}-${Math.random()}@test.com`;
  const password = "password123";

  const registerRes = await request(app)
    .post("/auth/register")
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ name: `Test ${role}`, email, password, role });
  expectStatus(registerRes, 201, "register");

  const loginRes = await request(app)
    .post("/auth/login")
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ email, password });
  expectStatus(loginRes, 200, "login");

  // The token arrives as a cookie, e.g. "token=eyJ...; Path=/; HttpOnly".
  // Keep only the "token=eyJ..." part.
  const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

  return { cookie, id: loginRes.body.user.id };
}

// Creates an event 7 days from now, publishes it, returns the event
export async function createPublishedEvent(cookie) {
  const start_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const createRes = await request(app)
    .post("/events")
    .set("Cookie", cookie)
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ name: "Test Event", venue: "Test Venue", start_at });
  expectStatus(createRes, 201, "create event");

  const eventId = createRes.body.event.id;

  const publishRes = await request(app)
    .patch(`/events/${eventId}`)
    .set("Cookie", cookie)
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ status: "published" });
  expectStatus(publishRes, 200, "publish event");

  return publishRes.body.event;
}

// Creates a tier with the given total quantity, returns the tier
export async function createTier(cookie, eventId, total_quantity) {
  const res = await request(app)
    .post(`/events/${eventId}/ticket_tiers`)
    .set("Cookie", cookie)
    .set("X-Requested-With", "XMLHttpRequest")
    .send({ name: "General", price: 50, total_quantity });
  expectStatus(res, 201, "create tier");

  return res.body.tier;
}