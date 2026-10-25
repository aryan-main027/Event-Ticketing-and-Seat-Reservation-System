import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyEvents, updateEventStatus } from "../api/organizer";
import type { Event, EventStatus } from "../api/events";

const badge: Record<EventStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function OrganizerDashboard() {
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
      // replace just this event in the list
      setEvents((list) => list.map((e) => (e.id === id ? updated : e)));
    } catch {
      setError("Could not update the event");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My events</h1>
        <Link
          to="/organizer/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create event
        </Link>
      </div>

      {loading && <p className="mt-6 text-slate-500">Loading...</p>}

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && events.length === 0 && !error && (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
          You have not created any events yet.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {events.map((e) => (
          <li key={e.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{e.name}</p>
                <p className="text-sm text-slate-500">
                  📍 {e.venue} · 🗓️ {new Date(e.start_at).toLocaleString()}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge[e.status]}`}>
                {e.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/organizer/events/${e.id}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Tiers and stats
              </Link>

              {e.status === "draft" && (
                <button
                  disabled={busyId === e.id}
                  onClick={() => changeStatus(e.id, "published")}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Publish
                </button>
              )}

              {e.status === "published" && (
                <button
                  disabled={busyId === e.id}
                  onClick={() => {
                    if (confirm("Cancel this event? Attendees will see it as cancelled.")) {
                      changeStatus(e.id, "cancelled");
                    }
                  }}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Cancel event
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}