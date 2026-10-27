
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createEvent } from "../api/organizer";

export default function CreateEvent() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startAt, setStartAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await createEvent({
        name: name.trim(),
        description: description.trim() || undefined,
        venue: venue.trim(),
        start_at: new Date(startAt).toISOString(),
      });

      navigate("/organizer");
    } catch {
      setError("Could not create the event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative mx-auto min-h-screen max-w-4xl overflow-hidden px-4 py-8 sm:px-6 lg:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-20 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-32 h-80 w-80 rounded-full bg-fuchsia-200/30 blur-3xl"
      />

      <div className="relative">
        {/* Back to organizer dashboard */}
        <Link
          to="/organizer"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-x-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <span aria-hidden="true">←</span>
          Back to Organizer Dashboard
        </Link>

        {/* Page header */}
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
              ORGANIZER STUDIO
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Create an event
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-indigo-100/80 sm:text-base">
              Bring people together. Add your event details below to get started.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="animate-fade-up rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-indigo-950/[0.04] sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Event details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Fill in the essential information for your event.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="event-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Event name
              </label>
              <input
                id="event-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bengaluru Tech Meetup"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="event-description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
                <span className="ml-2 font-normal text-slate-400">
                  (optional)
                </span>
              </label>
              <textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell attendees what your event is about..."
                rows={4}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="event-venue"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Venue
              </label>
              <input
                id="event-venue"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. RNSIT Auditorium, Bengaluru"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="event-start"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Start date and time
              </label>
              <input
                id="event-start"
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Link
                to="/organizer"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to dashboard
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating event...
                  </>
                ) : (
                  <>
                    Create event
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
