# Event Ticketing & Seat Reservation System

A backend-first ticketing platform where organizers create events with limited
ticket tiers, and attendees reserve and buy tickets.

## The problem

When many people try to buy the last few tickets at the same moment, a naive
system reads "1 ticket left" for several of them and sells the same ticket
more than once. This project guarantees that **a tier is never oversold**,
even under simultaneous requests.

## What makes it more than CRUD

- **Ticket lifecycle:** a ticket is available, then held for 10 minutes, then
  either booked or returned to the pool. Holds and bookings are separate tables
  because they have different lifetimes.
- **Concurrency control:** reservations run in a PostgreSQL transaction using
  row-level locking (`SELECT ... FOR UPDATE`), so simultaneous requests for the
  same tier are processed one at a time.
- **Verified by tests:** an automated test fires 20 simultaneous requests at a
  5-ticket tier and asserts exactly 5 succeed and 15 are rejected.

## Users

- **Organizer:** creates events and ticket tiers, views sales per tier.
- **Attendee:** browses events, holds tickets, confirms bookings.

## How a reservation works

1. **Hold:** the attendee requests N tickets of a tier. In one transaction the
   server locks the tier row (`SELECT ... FOR UPDATE`), checks availability,
   decrements `available_quantity`, and creates a hold that expires in 10 minutes.
2. **Confirm:** the attendee confirms (payment is mocked). In one transaction
   the server locks the hold row, checks it is still `active`, owned by the user,
   and not expired (using the database clock), then creates a booking and marks
   the hold `converted`.
3. **Expiry:** a cron job runs every 30 seconds. It locks each expired hold,
   re-checks its status, marks it `expired`, and returns the tickets to the tier.
   If a confirm and the cron job touch the same hold at once, the row lock makes
   them take turns, and the second one sees the new status and backs off.

Cron is only cleanup. Correctness does not depend on it, because the confirm
step checks expiry itself.

## Tech stack

| Technology | Why it is used |
|---|---|
| **Node.js + Express** | Node.js is the runtime; Express is the framework used to build the REST API. |
| **PostgreSQL** (`pg`, no ORM) | Reservations need real transactions, row locking and foreign keys. Raw SQL keeps every query visible and under my control. |
| **bcrypt** | Hashes passwords. It is deliberately slow, so brute force is expensive. |
| **JWT** (`jsonwebtoken`) | Proves who the user is on each request. Role and ownership checks are done in middleware and controllers. |
| **node-cron** | Runs the background job that expires abandoned holds every 30 seconds. |
| **helmet** | Adds security headers to responses, e.g. `X-Content-Type-Options: nosniff`. |
| **cors** | Lets the frontend, which is on a different origin, call the API. Restricted to one configured origin. |
| **express-rate-limit** | Protects against abuse: 10 requests per 15 minutes on `/auth`, 100 per minute on other routes. |
| **Jest + supertest** | Automated tests: concurrency race, invariant check, and hold expiry. |
| **React** | Frontend (planned, not built yet). |

### Deliberately not used (in V1)

- **Redis:** one PostgreSQL instance handles the load; add it when caching or shared rate limiting is justified.
- **WebSockets:** plain HTTP is enough for the current features.
- **Message broker (RabbitMQ/BullMQ):** expiring holds is one process checking its own database on a timer, so there is nothing to pass between services.
- **ORM (Prisma):** to keep full control of the SQL, transactions and locks.

### Planned enhancements

These are intentionally left out of V1 and will be added as I learn the matching concepts.

| Technology | Why it is planned |
|---|---|
| **Pino** | Structured JSON logging with request ids, replacing `console.error`. Added once the app is containerised. |
| **Sentry** | Error tracking and alerts for unhandled errors. Added after the first deployment, when there is a real environment to monitor. |
| **Prometheus + Grafana** | Metrics and dashboards (request rates, error rates, response times). Part of the DevOps phase. |
| **Docker + Docker Compose** | Containerise the API and database for a consistent local and deployed setup. |
| **GitHub Actions (CI/CD)** | Run the test suite on every push, then automate deployment. |
| **Redis** | Shared rate limiting across multiple server instances, and caching of hot event pages under heavy read load. |
| **WebSockets (Socket.io)** | Live seat availability and a live organizer dashboard, once there is a real need for server push. |
| **httpOnly cookies + refresh tokens** | Safer token storage and longer sessions, with CSRF protection. |

### PostgreSQL over MongoDB

Booking tickets safely needs multi-step atomic transactions and row-level
locking (`SELECT ... FOR UPDATE`). PostgreSQL provides both natively, and the
reservation logic depends on them.

The data is also strongly relational: a booking belongs to a tier, a tier
belongs to an event, and a tier cannot exist without its event. PostgreSQL
enforces those links in the database with foreign keys (and `RESTRICT` stops an
event with bookings from being deleted). In MongoDB that integrity would have to
be enforced in application code, which is easier to get wrong.

Finally, every record has a fixed, predictable structure (events, tiers, holds,
bookings), so MongoDB's flexible schema gives no advantage here. MongoDB does
support transactions now, but there is no reason to give up foreign keys and
fixed schemas for data that is naturally relational.

### Stored `available_quantity` plus row locking

Each tier stores `total_quantity` (its fixed capacity) and `available_quantity`
(how many tickets are left right now).

Availability is stored rather than calculated from holds and bookings because
locking needs one number on one row. A calculated value is spread across several
tables, so two simultaneous requests could both calculate "1 ticket left" and both
create a hold. This is a read-then-write race condition. When a hold expires, the
cron job simply adds its tickets back to the stored number.

To create a hold, the server opens a transaction and reads the tier row with
`SELECT ... FOR UPDATE`. This locks the row, so a second request for the same tier
waits. The transaction keeps the lock held until `available_quantity` is
decremented and the hold is inserted. When the second request finally proceeds, it
reads the updated value, sees there are not enough tickets, and is rejected with a
409. The lock is only effective inside a transaction; a standalone `SELECT ... FOR
UPDATE` would release it immediately.

### Holds and bookings are separate tables

A hold and a booking have different lifetimes. A hold is a temporary claim: it
reserves tickets for 10 minutes and may never become real. A booking is a
permanent record of a completed purchase.

They also need different columns. A hold has an `expiry_time` and a status
(`active`, `expired` or `converted`); a booking has neither, because it is
already final.

Merging them into one table would mix abandoned and expired holds into the
booking history. The table that records real sales would be cluttered with rows
that never became purchases, and fields like `expiry_time` would be meaningless
on confirmed rows.

When a hold is confirmed, one transaction locks the hold row, checks it, creates
a booking, and marks the hold `converted`. When a hold is not confirmed in time,
the cron job locks it in a separate transaction, marks it `expired`, and returns
its tickets to the tier. Expired holds stay in the `holds` table as history.

`bookings.hold_id` links each booking to the hold it came from. This gives
traceability and makes it possible to measure how many holds turn into bookings.

### Cron is cleanup, not correctness

A cron job runs every 30 seconds. It finds holds that are `active` with
`expiry_time <= NOW()`, marks them `expired`, and adds their tickets back to the
tier's `available_quantity`.

Cron is only cleanup. A hold can pass its expiry and still be marked `active` for
up to 30 seconds until cron visits it. Correctness does not depend on cron,
because `confirmBooking` checks `expiry_time > NOW()` itself, using the database
clock, and rejects an expired hold with a 409.

The two comparisons are exact opposites (`<=` for cron, `>` for confirm), so a
hold is never both confirmable and expirable at the same instant.

If cron and a confirm reach the same hold at the same time, the row lock makes
them take turns. Whoever goes second re-checks the hold's status after waiting:
if confirm went first, the hold is `converted` and cron skips it; if cron went
first, the hold is `expired` and confirm returns 409. A hold can therefore never
end up both booked and expired.

### Foreign keys use RESTRICT

Almost every foreign key uses `ON DELETE RESTRICT`: the database refuses to
delete a row while other rows still reference it. This system stores paid
records, so a deletion should be an explicit decision, not a silent ripple.

`CASCADE` was rejected because it would destroy history. Deleting an organizer
would cascade to their events, then their tiers, and the bookings and holds that
depend on those tiers would be lost or left dangling. An attendee who paid would
lose the proof of their purchase because of something the organizer did.

The one exception is `bookings.user_id`, which uses `ON DELETE SET NULL`. A
booking is a permanent record, so it must survive if its user deletes their
account, and the user must not be blocked from leaving. For this to work the
column is nullable (no `NOT NULL`).

In practice, events are never hard-deleted. An organizer sets an event's status
to `cancelled`, and the rows stay as history.

### Integer ids

Every table uses an auto-incrementing integer id (`SERIAL`). Integers are small
(4 bytes, versus 16 for a UUID), cheap to index, and easy to read in URLs and
logs (`/holds/15`). At this project's scale, UUIDs add complexity without a real
benefit.

The trade-off is that sequential ids are guessable: anyone can try `/holds/1`,
`/holds/2` and so on. This is limited in two ways. Ownership is checked in the
query itself (`WHERE id = $1 AND user_id = $2`), so another user's row is never
fetched, and a hold or booking that is not yours returns 404, the same as one that
does not exist, so guessing reveals nothing.

In a real public system I would use UUIDs, or an internal integer key with a
separate public UUID for anything shown in URLs.

### Database clock for expiry checks

Hold expiry is always decided by the database's clock, using `NOW()` in SQL,
never by `new Date()` in Node. The Node server and the PostgreSQL server can run
on different machines whose clocks differ by a few seconds. If cron used one
clock and the confirm step used another, there would be a window where a hold
looks expired to one and still valid to the other.

Because both the cron job (`expiry_time <= NOW()`) and `confirmBooking`
(`expiry_time > NOW()`) ask the same database for the time, they always agree
on whether a hold has expired. Every hold also returns an `in_time` value
computed by the database, so the frontend never has to guess using the
browser's clock.

### Strict ids, lenient paging

Resource ids and paging parameters are treated differently on purpose.

**Ids are validated strictly.** An id identifies exactly one row, so anything that
is not a positive integer is rejected with `400`. The check uses `Number()` and
`Number.isInteger()`, because `parseInt("12abc")` returns `12` and would quietly
treat a malformed id as a real one, while `Number("12abc")` is `NaN` and is
rejected.

**Paging parameters are corrected, not rejected.** `page` and `limit` are optional
settings, so bad values are replaced with safe ones instead of causing an error:
`limit` defaults to 10 and is capped at 20, and `page` defaults to 1. Values are
read with `parseInt`, which always yields a whole number or `NaN`, and `NaN`,
zero and negatives fall back to the defaults.

The cap on `limit` is the real protection. Without it, a client could ask for
`limit=1000000` and force the database to return an entire table in one response.

## Security

The backend includes the following security measures:

- **Password hashing:** Passwords are hashed using bcrypt instead of being stored as plain text.
- **Authentication:** Protected routes require a valid JWT sent through the `Authorization: Bearer <token>` header.
- **Role-based access control:** Middleware restricts organizer and attendee operations according to their roles.
- **Resource ownership:** Attendees can access only their own holds and bookings. Organizers can modify only their own events.
- **Input validation:** Resource IDs and quantities are validated before database operations.
- **SQL injection protection:** Database queries use parameterized SQL rather than directly interpolating user input.
- **Concurrency safety:** Ticket holds use PostgreSQL transactions and row-level locking to prevent overselling.
- **Rate limiting:** Limits excessive requests to the API.
- **Security headers and CORS:** Helmet and CORS middleware provide additional HTTP security controls.
- **Environment variables:** Database connection strings, JWT secrets, and other configuration values are kept outside the source code.

### Security limitations

- JWTs are currently returned in the response body. HttpOnly cookies and appropriate CSRF protection are planned for future authentication hardening.
- Rate-limit counters are stored in server memory, so they are not shared across multiple server instances.
- Integer resource IDs are predictable. Authorization and ownership checks are still required and are enforced independently of ID predictability.

## API Reference

Protected endpoints require:

`Authorization: Bearer <token>`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a user |
| POST | `/auth/login` | Public | Authenticate a user |
| POST | `/events` | Organizer | Create an event |
| GET | `/events` | Public | Browse published events |
| GET | `/events/:id` | Public | View an event |
| PATCH | `/events/:id` | Organizer (owner) | Update an owned event |
| POST | `/events/:eventId/ticket_tiers` | Organizer (owner) | Create a ticket tier |
| GET | `/events/:eventId/ticket_tiers` | Public | List an event's ticket tiers |
| POST | `/holds` | Attendee | Place a temporary ticket hold |
| GET | `/holds` | Attendee | List the attendee's holds |
| GET | `/holds/:id` | Attendee (owner) | View a specific hold |
| POST | `/bookings` | Attendee | Confirm a hold and create a booking |
| GET | `/bookings` | Attendee | List the attendee's bookings |
| GET | `/bookings/:id` | Attendee (owner) | View a specific booking |
| GET | `/events/:eventId/stats` | Organizer | View booking statistics for owned events |
| GET | `/health` | Public | Check application health |

**Note:** Verify the exact organizer statistics path and all route paths against your current route files before publishing this table.

### Status codes

| Code | Meaning |
|---|---|
| `200 OK` | Request completed successfully |
| `201 Created` | A resource was created |
| `400 Bad Request` | Invalid input |
| `401 Unauthorized` | Missing, invalid, or expired authentication token |
| `403 Forbidden` | Authenticated user lacks the required role or permission |
| `404 Not Found` | Resource does not exist or is hidden by an ownership/access rule |
| `409 Conflict` | Booking conflict, unavailable inventory, expired or already-used hold, or another state conflict |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server error |

## Project Structure

```text
backend/
├── app.js                  # Express app and middleware
├── server.js               # Starts the server and schedules expiry job
├── src/
│   ├── controllers/        # Request handling and business logic
│   ├── routes/             # API route definitions
│   ├── middleware/         # Authentication and authorization
│   ├── jobs/               # Hold expiry job
│   └── db/
│       ├── pool.js         # PostgreSQL connection pool
│       └── schema.sql      # Database schema
├── tests/                  # Jest and Supertest tests
├── .env.example            # Example environment configuration
├── package.json
└── README.md
```

The application follows a modular monolith architecture: one Express application with separate modules for routes, controllers, middleware, database access, and background jobs. This keeps the system understandable without introducing unnecessary distributed-system complexity.

*Adjust the tree to match your actual repository.*

## Running Locally

### Requirements

- Node.js 20 or later
- PostgreSQL 15 or later
- npm

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Create the databases and database user

Connect to PostgreSQL using an administrative account and run:

```sql
CREATE DATABASE ticketing_db;
CREATE DATABASE ticketing_test;

CREATE USER ticketing_user WITH PASSWORD 'your_password';

GRANT ALL PRIVILEGES ON DATABASE ticketing_db
TO ticketing_user;

GRANT ALL PRIVILEGES ON DATABASE ticketing_test
TO ticketing_user;
```

Connect to each database and grant the required schema permissions:

```sql
GRANT ALL ON SCHEMA public TO ticketing_user;
```

Run that grant separately while connected to `ticketing_db` and `ticketing_test`. Ensure the user also has the required table and sequence permissions for your schema setup.

### 3. Initialize the schema

Run these commands from the `backend` directory:

```bash
psql -U ticketing_user -d ticketing_db \
  -h localhost -f src/db/schema.sql

psql -U ticketing_user -d ticketing_test \
  -h localhost -f src/db/schema.sql
```

The test database is separate so automated tests can reset their data without affecting development data.

### 4. Configure environment variables

Create a `.env` file in the `backend` directory using `.env.example` as a reference.

```dotenv
PORT=3000
DATABASE_URL=postgresql://ticketing_user:PASSWORD@localhost:5432/ticketing_db
DATABASE_URL_TEST=postgresql://ticketing_user:PASSWORD@localhost:5432/ticketing_test
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
```

Replace the example password and secret with your own values. URL-encode special characters in the database password when necessary.

Do not commit `.env` or real credentials to GitHub.

### 5. Start the server

```bash
node server.js
```

Use the start command defined in your `package.json` instead if it differs.

## Running Tests

Run the automated test suite from the `backend` directory:

```bash
npm test
```

The tests use the separate `ticketing_test` database. Make sure it exists and has the schema loaded before running them.

| Test | What it verifies |
|---|---|
| `concurrency.test.js` | Twenty simultaneous hold requests against five tickets produce exactly five successful holds and fifteen conflicts, without overselling. |
| `invariant.test.js` | Inventory remains consistent after concurrent holds and booking confirmations. |
| `expiry.test.js` | Expired holds return inventory, converted holds are not expired again, and an expired hold cannot be confirmed. |
| `smoke.test.js` | The Express application starts correctly and the health endpoint responds. |

These tests focus on correctness and important edge cases, rather than simply increasing the test count.

## Known Limitations

- **Mock payments:** Booking confirmation does not process a real payment.
- **Quantity-based tickets:** Individual seat maps and seat selection are not implemented.
- **No refunds or attendee cancellations:** These workflows are outside the current MVP.
- **No frontend:** The React application has not yet been implemented.
- **Authentication hardening:** HttpOnly cookies and refresh-token handling remain future work.
- **Rate limiting:** Counters are in memory and are not shared across instances.
- **Event lifecycle:** Restrictions on transitioning a cancelled event back to published need further hardening.
- **Draft visibility:** Draft events are currently hidden on public routes, including from their organizer on those routes.
- **Predictable IDs:** Integer IDs can be guessed, so every protected resource must continue enforcing authorization and ownership checks.
- **Single-instance design:** The backend has not yet been adapted or load-tested for horizontal scaling.

## Roadmap

### Frontend

- Build the React interface for browsing events, viewing ticket availability, placing holds, and confirming bookings.
- Display hold expiry and booking status clearly.

### Authentication and security

- Introduce refresh tokens and HttpOnly cookies with appropriate CSRF protection.
- Review all event lifecycle transitions and resource-level authorization.
- Add further integration tests for unauthorized access and invalid state transitions.

### DevOps

- Learn Docker and containerize the API.
- Use Docker Compose for local application and database setup.
- Add CI/CD to run tests automatically and support deployment.
- Improve environment configuration and secrets management.

### Observability

- Introduce structured logging with Pino.
- Add error tracking with Sentry after deployment.
- Add health checks, metrics, and dashboards as the project evolves.

### System design and scalability

- Load-test concurrent booking requests.
- Measure database and connection-pool bottlenecks.
- Evaluate Redis for shared rate limiting and caching frequently requested event data.
- Study horizontal scaling and asynchronous processing when a real requirement justifies them.

### Product features

- Integrate a real payment gateway.
- Add seat-level maps and selection.
- Add cancellation, refund, notification, and check-in workflows.

The current goal is to keep the V1 backend correct, understandable, and well-tested before adding these enhancements.
