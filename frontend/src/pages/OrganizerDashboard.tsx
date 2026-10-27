
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMyEvents, updateEventStatus } from "../api/organizer";
import type { Event, EventStatus } from "../api/events";

const badge: Record<EventStatus, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-600",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

export default function OrganizerDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchMyEvents()
      .then((e) => {
        if (!ignore) setEvents(e);
      })
      .catch(() => {
        if (!ignore) setError("Could not load your events");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const changeStatus = async (id: number, status: EventStatus) => {
    setBusyId(id);
    setError(null);

    try {
      const updated = await updateEventStatus(id, status);
      setEvents((list) => list.map((e) => (e.id === id ? updated : e)));
    } catch {
      setError("Could not update the event");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="relative mx-auto min-h-screen max-w-6xl overflow-hidden px-4 py-8 sm:px-6 lg:py-12">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-[28rem] h-72 w-72 rounded-full bg-fuchsia-200/30 blur-3xl"
      />

      <div className="relative">
        {/* Back to Home */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-x-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <span aria-hidden="true">←</span>
          Back to Home
        </button>

        {/* Header */}
        <section className="animate-fade-up relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10 bg-white/[0.04]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 right-28 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide text-indigo-100">
                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300" />
                ORGANIZER STUDIO
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                My events
              </h1>

              <p className="mt-2 max-w-lg text-sm leading-6 text-indigo-100/80 sm:text-base">
                Manage your events, publish upcoming experiences, and keep
                everything organized in one place.
              </p>
            </div>

            <Link
              to="/organizer/new"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-950 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-950"
            >
              <span className="text-lg leading-none">+</span>
              Create event
            </Link>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-3 border-t border-white/15 pt-5 text-sm text-indigo-100/80">
            <span className="rounded-lg bg-white/10 px-3 py-2">
              {events.length} {events.length === 1 ? "event" : "events"} in your
              workspace
            </span>
            <span className="rounded-lg bg-white/10 px-3 py-2">
              Manage publishing and event details
            </span>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm animate-fade-up"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
              !
            </span>
            <div className="pt-1">{error}</div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <section
            aria-live="polite"
            className="rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-sm animate-fade-up"
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm font-medium text-slate-600">
                Loading your events...
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && !error && (
          <section className="animate-fade-up rounded-3xl border border-dashed border-indigo-200 bg-white/80 px-6 py-14 text-center shadow-sm sm:py-20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-fuchsia-100 text-3xl">
              ✦
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Your next event starts here
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You have not created any events yet. Start planning your first
              event and manage it from this dashboard.
            </p>

            <Link
              to="/organizer/new"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="text-lg leading-none">+</span>
              Create your first event
            </Link>
          </section>
        )}

        {/* Event list */}
        {!loading && events.length > 0 && (
          <section className="animate-fade-up">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Your workspace
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select an event to manage its tiers and stats.
                </p>
              </div>

              <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 sm:inline-flex">
                {events.length} total
              </span>
            </div>

            <ul className="space-y-4">
              {events.map((e, index) => (
                <li
                  key={e.id}
                  style={{ animationDelay: `${index * 70}ms` }}
                  className="group animate-fade-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/[0.06]"
                >
                  <div className="flex">
                    <div
                      aria-hidden="true"
                      className={`w-1.5 shrink-0 ${
                        e.status === "published"
                          ? "bg-gradient-to-b from-emerald-400 to-teal-500"
                          : e.status === "cancelled"
                            ? "bg-gradient-to-b from-red-400 to-rose-500"
                            : "bg-gradient-to-b from-indigo-400 to-fuchsia-500"
                      }`}
                    />

                    <div className="min-w-0 flex-1 p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="break-words text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-700 sm:text-xl">
                              {e.name}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badge[e.status]}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  e.status === "published"
                                    ? "bg-emerald-500"
                                    : e.status === "cancelled"
                                      ? "bg-red-500"
                                      : "bg-slate-400"
                                }`}
                              />
                              {e.status}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
                            <span className="flex items-start gap-2">
                              <span aria-hidden="true">📍</span>
                              <span className="break-words">{e.venue}</span>
                            </span>

                            <span className="flex items-start gap-2">
                              <span aria-hidden="true">🗓️</span>
                              <span>{new Date(e.start_at).toLocaleString()}</span>
                            </span>
                          </div>
                        </div>

                        <span className="hidden shrink-0 text-xs font-medium text-slate-400 sm:block">
                          EVENT #{e.id}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        <Link
                          to={`/organizer/events/${e.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Tiers and stats
                          <span aria-hidden="true">→</span>
                        </Link>

                        {e.status === "draft" && (
                          <button
                            disabled={busyId === e.id}
                            onClick={() => changeStatus(e.id, "published")}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          >
                            {busyId === e.id ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Publishing...
                              </>
                            ) : (
                              <>
                                <span aria-hidden="true">↗</span>
                                Publish
                              </>
                            )}
                          </button>
                        )}

                        {e.status === "published" && (
                          <button
                            disabled={busyId === e.id}
                            onClick={() => {
                              if (
                                confirm(
                                  "Cancel this event? Attendees will see it as cancelled.",
                                )
                              ) {
                                changeStatus(e.id, "cancelled");
                              }
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition duration-200 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            {busyId === e.id ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <span aria-hidden="true">×</span>
                                Cancel event
                              </>
                            )}
                          </button>
                        )}
                      </div>
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
