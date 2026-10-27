import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEvents, type Event } from "../api/events";
import { EventCardSkeleton } from "../components/Skeleton";

const LIMIT = 6;

// Visual-only cover images. No backend or Event type changes needed.
const coverImages = [
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85",
];

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
        if (!ignore) {
          setLoading(false);
        }
      });

    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      ignore = true;
    };
  }, [page]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {/* Hero */}
        <section className="relative isolate mb-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-800 px-6 py-12 text-white shadow-2xl shadow-violet-200/60 sm:px-10 sm:py-16 lg:px-14">
          {/* Decorative background */}
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-24 -z-10 h-80 w-80 rounded-full bg-fuchsia-500/30 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-32 right-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl"
          />

          <div className="animate-fade-up max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-100 backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-fuchsia-300" />
              Discover your next experience
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Discover events.
              <span className="mt-1 block bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
                Create memories.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-indigo-100 sm:text-lg">
              Reserve your tickets in seconds. Find your people, explore
              new experiences, and make every moment count.
            </p>

            <a
              href="#events"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-950 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:bg-violet-50 hover:shadow-xl active:scale-95"
            >
              Explore events
              <span aria-hidden="true" className="text-lg">
                ↓
              </span>
            </a>
          </div>

          {/* Decorative image */}
          <div className="pointer-events-none absolute -bottom-8 right-8 hidden h-56 w-64 rotate-3 overflow-hidden rounded-3xl border border-white/20 shadow-2xl shadow-black/30 lg:block xl:right-16 xl:h-64 xl:w-80">
            <img
              src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85"
              alt=""
              className="h-full w-full object-cover opacity-80"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-violet-500/10" />

            <div className="absolute bottom-4 left-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-200">
                Make it memorable
              </p>

              <p className="mt-1 text-lg font-bold text-white">
                Your next adventure
              </p>
            </div>
          </div>
        </section>

        {/* Events heading */}
        <section id="events" className="scroll-mt-6">
          <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                Find your next plan
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Explore events
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                Good times start with the right event.
              </p>
            </div>

            <span className="w-fit rounded-full border border-violet-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              Page {page}
            </span>
          </div>

          {error && (
            <p
              role="alert"
              className="animate-fade-up rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {/* Loading skeletons */}
          {loading && events.length === 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: LIMIT }, (_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && events.length === 0 && (
            <div className="animate-fade-up rounded-3xl border border-dashed border-violet-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-3xl">
                ✨
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                No upcoming events
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Check back later for new experiences.
              </p>
            </div>
          )}

          {/* Event cards */}
          {events.length > 0 && (
            <div
              className={`grid grid-cols-1 gap-6 transition-opacity duration-300 sm:grid-cols-2 lg:grid-cols-3 ${
                loading ? "opacity-50" : "opacity-100"
              }`}
            >
              {events.map((event, i) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  style={{ animationDelay: `${i * 90}ms` }}
                  className="group block animate-fade-up overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/80 motion-reduce:animate-none motion-reduce:transition-none"
                >
                  {/* Image cover */}
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-800">
                    <img
                      src={coverImages[i % coverImages.length]}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-slate-950/10 transition duration-300 group-hover:from-indigo-950/80" />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {event.status === "cancelled" ? (
                        <span className="rounded-full border border-red-200/30 bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                          Cancelled
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                          Event #{event.id}
                        </span>
                      )}
                    </div>

                    <span
                      aria-hidden="true"
                      className="absolute right-4 top-4 flex h-10 w-10 translate-y-1 items-center justify-center rounded-full border border-white/30 bg-white/15 text-xl text-white opacity-0 backdrop-blur-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                    >
                      ↗
                    </span>

                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-200">
                        Featured experience
                      </p>

                      <h2 className="line-clamp-2 text-xl font-bold leading-snug text-white drop-shadow sm:text-2xl">
                        {event.name}
                      </h2>
                    </div>
                  </div>

                  {/* Event details */}
                  <div className="p-5 sm:p-6">
                    <p className="mb-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                      {event.description || "No description available."}
                    </p>

                    <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                      {/* Venue */}
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                          >
                            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                            <circle cx="12" cy="10" r="2.5" />
                          </svg>
                        </span>

                        <div className="min-w-0 pt-1.5">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Venue
                          </p>

                          <p className="mt-1 break-words font-medium text-slate-700">
                            {event.venue}
                          </p>
                        </div>
                      </div>

                      {/* Date and time */}
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-600 transition-colors group-hover:bg-fuchsia-100">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                          >
                            <rect x="3" y="5" width="18" height="16" rx="2" />
                            <path d="M16 3v4M8 3v4M3 10h18" />
                          </svg>
                        </span>

                        <div className="min-w-0 pt-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Date &amp; time
                          </p>

                          <p className="mt-1 font-semibold text-slate-800">
                            {new Date(event.start_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs font-medium text-slate-400">
                        Discover more
                      </span>

                      <span className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 transition-all duration-300 group-hover:gap-3 group-hover:text-indigo-700">
                        View details
                        <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {(events.length > 0 || page > 1) && (
            <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage - 1)}
                disabled={page === 1 || loading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              >
                ← Previous
              </button>

              <span className="text-sm font-semibold text-slate-500">
                Page {page}
              </span>

              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={!hasMore || loading}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}