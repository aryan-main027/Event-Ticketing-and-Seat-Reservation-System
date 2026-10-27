
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBookings, type BookingDetail } from "../api/bookings";

export default function MyBookings() {
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchBookings()
      .then((b) => {
        if (!ignore) setBookings(b);
      })
      .catch(() => {
        if (!ignore) setError("Could not load your bookings");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="relative mx-auto min-h-screen max-w-5xl overflow-hidden px-4 py-8 sm:px-6 lg:py-12">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-20 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-32 h-80 w-80 rounded-full bg-fuchsia-200/30 blur-3xl"
      />

      <div className="relative">
        {/* Header */}
        <section className="animate-fade-up relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10 bg-white/[0.04]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide text-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300" />
              YOUR EXPERIENCES
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              My bookings
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
              All your booked experiences, organized in one place. Get the
              details you need before your next event.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 border-t border-white/15 pt-5 text-sm text-indigo-100/80">
              <span className="rounded-lg bg-white/10 px-3 py-2">
                {bookings.length}{" "}
                {bookings.length === 1 ? "booking" : "bookings"}
              </span>
              <Link
                to="/"
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 font-medium transition hover:bg-white/20"
              >
                Discover events →
              </Link>
            </div>
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <section
            aria-live="polite"
            className="animate-fade-up rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm font-medium text-slate-600">
                Loading your bookings...
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <section
            role="alert"
            className="animate-fade-up rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
                !
              </span>
              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load bookings
                </h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && !error && bookings.length === 0 && (
          <section className="animate-fade-up rounded-3xl border border-dashed border-indigo-200 bg-white/80 px-6 py-14 text-center shadow-sm sm:py-20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-fuchsia-100 text-3xl">
              🎟️
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Your next experience awaits
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You have no bookings yet. Explore upcoming events and find
              something worth looking forward to.
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Browse events
              <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}

        {/* Booking cards */}
        {!loading && !error && bookings.length > 0 && (
          <section className="animate-fade-up">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Your experiences
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review the details of your bookings below.
              </p>
            </div>

            <ul className="grid gap-4 md:grid-cols-2">
              {bookings.map((b, index) => (
                <li
                  key={b.id}
                  style={{ animationDelay: `${index * 70}ms` }}
                  className="group animate-fade-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/[0.06]"
                >
                  {/* Card accent */}
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-xl">
                        🎫
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                          Booking #{b.id}
                        </p>
                        <h3 className="mt-1 break-words text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-700">
                          {b.event_name}
                        </h3>
                      </div>
                    </div>

                    {/* Ticket details */}
                    <div className="mt-5 rounded-xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/80 to-violet-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                        Ticket details
                      </p>

                      <p className="mt-2 font-semibold text-slate-900">
                        {b.quantity} × {b.tier_name}
                      </p>

                      <div className="mt-3 flex items-end justify-between gap-3 border-t border-indigo-100 pt-3">
                        <div>
                          <p className="text-xs text-slate-500">Price per ticket</p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            ₹{b.price}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-500">Quantity</p>
                          <p className="mt-1 text-sm font-bold text-indigo-700">
                            {b.quantity}{" "}
                            {b.quantity === 1 ? "ticket" : "tickets"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Event information */}
                    <div className="mt-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          📍
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-400">
                            Venue
                          </p>
                          <p className="mt-0.5 break-words text-sm font-medium text-slate-700">
                            {b.event_venue}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          🗓️
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-400">
                            Event date
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-slate-700">
                            {new Date(b.event_start_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Booking timestamp */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-400">
                        Booked on{" "}
                        {new Date(b.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
