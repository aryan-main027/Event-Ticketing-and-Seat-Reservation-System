
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { fetchEvent, fetchTiers, type Event, type Tier } from "../api/events";
import { createHold } from "../api/holds";
import { useAuthStore } from "../store/authStore";

const coverImages = [
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85",
];

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
    action = <span className="text-sm font-medium text-slate-400">Unavailable</span>;
  } else if (tier.available_quantity === 0) {
    action = (
      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
        Sold out
      </span>
    );
  } else if (user?.role === "ATTENDEE") {
    action = (
      <div className="flex flex-wrap items-center gap-2">
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
          aria-label={`Quantity for ${tier.name}`}
          className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
        />
        <button
          onClick={handleHold}
          disabled={submitting}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {submitting ? "Holding..." : "Hold tickets"}
        </button>
      </div>
    );
  } else if (!user) {
    action = (
      <Link
        to="/login"
        className="text-sm font-semibold text-violet-600 transition hover:text-indigo-800"
      >
        Log in to book →
      </Link>
    );
  } else {
    // organizers cannot hold tickets
    action = <span className="text-sm text-slate-600">{tier.available_quantity} left</span>;
  }

  return (
    <li className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/50 motion-reduce:transition-none sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-fuchsia-100 text-violet-600 transition duration-300 group-hover:scale-105">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-6 w-6"
            >
              <path d="M3 8a2 2 0 0 0 0 4v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2Z" />
              <path d="M13 5v2m0 3v2m0 3v2" />
            </svg>
          </div>

          <div className="min-w-0">
            <p className="font-bold text-slate-900 transition-colors group-hover:text-violet-700">
              {tier.name}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {cancelled
                ? "Reservations unavailable"
                : tier.available_quantity > 0
                  ? `${tier.available_quantity} tickets available`
                  : "No tickets currently available"}
            </p>
            <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
              ₹{tier.price}
            </p>
          </div>
        </div>

        <div className="sm:shrink-0">{action}</div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 animate-fade-up rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
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
    return (
      <main className="min-h-[60vh] bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl animate-pulse space-y-5">
          <div className="h-5 w-32 rounded bg-violet-100" />
          <div className="h-64 rounded-3xl bg-gradient-to-br from-indigo-100 to-fuchsia-100" />
          <div className="h-8 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <p className="pt-3 text-sm text-slate-500">Loading event details...</p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-[60vh] bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl animate-fade-up rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-3xl">
            🔎
          </div>
          <p className="mt-5 text-2xl font-extrabold text-slate-900">
            Event not found
          </p>
          <p className="mt-2 text-sm text-slate-500">
            This event may have been removed or the link may be incorrect.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            ← Back to events
          </Link>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-[60vh] bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl animate-fade-up rounded-2xl border border-red-200 bg-red-50 p-5">
          <p role="alert" className="text-sm font-medium text-red-700">
            {error ?? "Could not load this event"}
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-sm font-semibold text-violet-700 transition hover:text-indigo-900"
          >
            ← Back to events
          </Link>
        </div>
      </main>
    );
  }

  const cancelled = event.status === "cancelled";
  const coverImage =
    coverImages[(Math.max(1, event.id) - 1) % coverImages.length];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-violet-700"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          Back to events
        </Link>

        {/* Event cover */}
        <section className="relative mt-5 animate-fade-up overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-900 shadow-xl shadow-violet-200/50">
          <div className="absolute inset-0">
            <img
              src={coverImage}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-indigo-950/10" />
          </div>

          <div className="relative flex min-h-[340px] flex-col justify-end p-6 text-white sm:min-h-[390px] sm:p-10 lg:p-12">
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                Event #{event.id}
              </span>

              {cancelled ? (
                <span className="rounded-full border border-red-200/30 bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  Cancelled
                </span>
              ) : (
                <span className="rounded-full border border-emerald-200/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-md">
                  Explore this event
                </span>
              )}
            </div>

            <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {event.name}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              {event.description || "No description available."}
            </p>
          </div>
        </section>

        {/* Event information */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:border-violet-200 hover:shadow-md motion-reduce:transition-none">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
              >
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Location
              </p>
              <p className="mt-2 break-words font-semibold text-slate-900">
                {event.venue}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:border-fuchsia-200 hover:shadow-md motion-reduce:transition-none">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-50 text-fuchsia-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Date & time
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {new Date(event.start_at).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Ticket tiers */}
        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                Make it yours
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Ticket tiers
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Choose your ticket and secure your spot.
              </p>
            </div>

            <span className="w-fit rounded-full border border-violet-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              {tiers.length} {tiers.length === 1 ? "option" : "options"}
            </span>
          </div>

          {cancelled && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              This event has been cancelled. Ticket reservations are unavailable.
            </div>
          )}

          {tiers.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-violet-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
              No tickets have been added yet.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {tiers.map((tier) => (
                <TierRow key={tier.id} tier={tier} cancelled={cancelled} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
