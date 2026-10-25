
import { useEffect, useState } from "react";
import { fetchEvents, type Event } from "../api/events";

const LIMIT = 3; // Small on purpose, so you can see paging while testing

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Set loading true and clear any previous error
    setLoading(true);
    setError(null);

    // 2. Fetch events for the current page
    fetchEvents(page, LIMIT)
      .then((data) => {
        // 3. Update events and pagination state
        setEvents(data.events);
        setHasMore(data.hasMore);
      })
      .catch(() => {
        // 4. Handle request failure
        setError("Could not load events");
      })
      .finally(() => {
        // 5. Stop the loading state
        setLoading(false);
      });
  }, [page]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Discover Events
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Find your next experience.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p>Loading events...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* Empty state */}
      {events.length === 0 && !loading && !error && (
        <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
          No upcoming events
        </p>
      )}

      {/* Event cards */}
      {!loading && !error && events.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {event.name}
                  </h2>

                  <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                    {event.status}
                  </span>
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
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm font-medium text-slate-500">
              Page {page}
            </span>

            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore || loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}
