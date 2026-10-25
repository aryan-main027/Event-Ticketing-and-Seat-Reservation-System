import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { fetchEvent, fetchTiers, type Event, type Tier } from "../api/events";
import { createHold } from "../api/holds";
import { useAuthStore } from "../store/authStore";

// One row per tier. It owns its own quantity, error and submitting state.
function TierRow({ tier, cancelled }: { tier: Tier; cancelled: boolean }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleHold = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const hold = await createHold(tier.id, quantity);
      navigate(`/holds/${hold.id}`);
    } catch (err) {
      if (isAxiosError<{ error?: string }>(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.error;

        if (!err.response) setError("Cannot connect to the server.");
        else if (status === 409) setError(message ?? "Not enough tickets left. Try fewer.");
        else if (status === 401) setError("Please log in again.");
        else if (status === 400) setError(message ?? "Invalid request.");
        else if (status === 429) setError("Too many requests. Please wait a moment.");
        else setError("Something went wrong.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // What appears on the right side of the row
  let action;
  if (cancelled) {
    action = <span className="text-sm text-slate-400">Unavailable</span>;
  } else if (tier.available_quantity === 0) {
    action = (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
        Sold out
      </span>
    );
  } else if (user?.role === "ATTENDEE") {
    action = (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={tier.available_quantity}
          value={quantity}
          disabled={submitting}
          onChange={(e) =>
            setQuantity(
              Math.min(Math.max(1, Number(e.target.value) || 1), tier.available_quantity)
            )
          }
          className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-50"
        />
        <button
          onClick={handleHold}
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Holding..." : "Hold tickets"}
        </button>
      </div>
    );
  } else if (!user) {
    action = (
      <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
        Log in to book
      </Link>
    );
  } else {
    // organizers cannot hold tickets
    action = <span className="text-sm text-slate-600">{tier.available_quantity} left</span>;
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{tier.name}</p>
          <p className="text-sm text-slate-500">
            ₹{tier.price}
            {!cancelled && tier.available_quantity > 0 && ` · ${tier.available_quantity} left`}
          </p>
        </div>
        {action}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </li>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const eventId = Number(id);
  const validId = Number.isInteger(eventId) && eventId > 0;

  const [event, setEvent] = useState<Event | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!validId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let ignore = false;
    setLoading(true);
    setNotFound(false);
    setError(null);

    Promise.all([fetchEvent(eventId), fetchTiers(eventId)])
      .then(([e, t]) => {
        if (ignore) return;
        setEvent(e);
        setTiers(t);
      })
      .catch((err) => {
        if (ignore) return;
        if (isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError("Could not load this event");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [eventId, validId]);

  if (loading) {
    return <p className="p-6 text-slate-500">Loading...</p>;
  }

  if (notFound) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-lg font-semibold text-slate-900">Event not found</p>
        <Link to="/" className="mt-3 inline-block text-indigo-600 hover:text-indigo-800">
          Back to events
        </Link>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "Could not load this event"}
        </p>
        <Link to="/" className="mt-3 inline-block text-indigo-600 hover:text-indigo-800">
          Back to events
        </Link>
      </main>
    );
  }

  const cancelled = event.status === "cancelled";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-800">
        ← Back to events
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{event.name}</h1>
        {cancelled && (
          <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Cancelled
          </span>
        )}
      </div>

      <p className="mt-3 text-slate-600">{event.description || "No description available."}</p>

      <div className="mt-4 space-y-1 text-sm text-slate-500">
        <p>📍 {event.venue}</p>
        <p>🗓️ {new Date(event.start_at).toLocaleString()}</p>
      </div>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">Ticket tiers</h2>

      {tiers.length === 0 ? (
        <p className="mt-3 text-slate-500">No tickets have been added yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {tiers.map((tier) => (
            <TierRow key={tier.id} tier={tier} cancelled={cancelled} />
          ))}
        </ul>
      )}
    </main>
  );
}