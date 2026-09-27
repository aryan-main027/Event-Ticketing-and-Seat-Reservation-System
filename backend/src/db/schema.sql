-- users
CREATE TYPE role_type AS ENUM ('ORGANIZER', 'ATTENDEE');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role role_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- events
CREATE TYPE status_type AS ENUM ('draft', 'published', 'cancelled');

CREATE TABLE events(
  id SERIAL PRIMARY KEY,
  organizer_id INT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  venue TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  status status_type NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ticket_tiers
CREATE TABLE ticket_tiers(
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  total_quantity INT NOT NULL CHECK (total_quantity >= 0),
  available_quantity INT NOT NULL CHECK (available_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE RESTRICT
);

-- holds
CREATE TYPE hold_type AS ENUM ('active', 'expired', 'converted');

CREATE TABLE holds(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  tier_id INT NOT NULL,
  quantity INT NOT NULL CHECK(quantity > 0),
  status hold_type NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_time TIMESTAMPTZ NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY(tier_id) REFERENCES ticket_tiers(id) ON DELETE RESTRICT
);

-- bookings
CREATE TABLE bookings(
  id SERIAL PRIMARY KEY,
  user_id INT,
  tier_id INT NOT NULL,
  hold_id INT NOT NULL,
  quantity INT NOT NULL CHECK(quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(tier_id) REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
  FOREIGN KEY(hold_id) REFERENCES holds(id) ON DELETE RESTRICT
);

-- indexes
CREATE INDEX idx_holds_status_expiry ON holds (status, expiry_time);
CREATE INDEX idx_bookings_user_id ON bookings (user_id);
CREATE INDEX idx_ticket_tiers_event_id ON ticket_tiers (event_id);
CREATE INDEX idx_events_organizer_id ON events (organizer_id);