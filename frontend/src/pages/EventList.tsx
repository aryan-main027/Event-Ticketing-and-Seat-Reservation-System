import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEvents, type Event } from "../api/events";
import { EventCardSkeleton } from "../components/Skeleton";

const LIMIT = 6;

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetchEvents(page, LIMIT)
      .then((data) => {
        if (ignore) return;
        setEvents(data.events);
        setHasMore(data.hasMore);
      })
      .catch(() => {
        if (ignore) return;
        setEvents([]);
        setHasMore(false);
        setError("Could not load events");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      ignore = true;
    };
  }, [page]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-10 text-white shadow-lg shadow-indigo-200 sm:px-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Discover events</h1>
        <p className="mt-2 max-w-xl text-indigo-100">
          Reserve your tickets in seconds. Every seat is held safely for you while you decide.
        </p>
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Skeletons on the very first load */}
      {loading && events.length === 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: LIMIT }, (_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
          No upcoming events
        </p>
      )}

      {events.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-5 transition-opacity duration-300 sm:grid-cols-2 lg:grid-cols-3 ${
            loading ? "opacity-50" : "opacity-100"
          }`}
        >
          {events.map((event, i) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              // each card starts 70ms after the previous one
              style={{ animationDelay: `${i * 70}ms` }}
              className="group block animate-fade-up rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg motion-reduce:animate-none"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                  {event.name}
                </h2>
                {event.status === "cancelled" && (
                  <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    Cancelled
                  </span>
                )}
              </div>

              <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-600">
                {event.description || "No description available."}
              </p>

              <div className="space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
                <p>
                  <span className="mr-2" aria-hidden="true">📍</span>
                  {event.venue}
                </p>
                <p>
                  <span className="mr-2" aria-hidden="true">🗓️</span>
                  {new Date(event.start_at).toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {(events.length > 0 || page > 1) && (
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1 || loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-500">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}