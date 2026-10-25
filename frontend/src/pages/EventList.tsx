import { useEffect, useState } from "react";
// UPDATED: Link so each card can open the event detail page (built next)
import { Link } from "react-router-dom";
import { fetchEvents, type Event } from "../api/events";

const LIMIT = 3; // small on purpose, so you can see paging while testing

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // UPDATED: `ignore` guards against a slow, older request overwriting a newer one.
    // The cleanup runs when `page` changes (or the component unmounts), which marks
    // the previous request's result as stale.
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
        // UPDATED: clear old data so an error never shows next to stale cards
        setEvents([]);
        setHasMore(false);
        setError("Could not load events");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    // UPDATED: scroll to the top whenever the page changes
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      ignore = true;
    };
  }, [page]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Discover Events</h1>
        <p className="mt-2 text-sm text-slate-500">Find your next experience.</p>
      </div>

      {/* Error state */}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Loading state: only on the very first load, when there is nothing to show yet */}
      {loading && events.length === 0 && (
        <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p>Loading events...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
          No upcoming events
        </p>
      )}

      {/* UPDATED: cards stay on screen while the next page loads (faded), so the layout
          doesn't jump. The old condition `!loading` hid them on every page change. */}
      {events.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
            loading ? "opacity-50" : "opacity-100"
          }`}
        >
          {events.map((event) => (
            // UPDATED: the whole card is a link to the detail page
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{event.name}</h2>

                {/* UPDATED: only show a badge when it carries information.
                    Every listed event is published, so that badge was noise.
                    Cancelled is what attendees actually need to see. */}
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

      {/* UPDATED: pagination shows whenever it is useful, not only when cards exist.
          Before, landing on an empty page left the user with no way back. */}
      {(events.length > 0 || page > 1) && (
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1 || loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm font-medium text-slate-500">Page {page}</span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}