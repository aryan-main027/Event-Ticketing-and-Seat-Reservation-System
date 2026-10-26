import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { createEvent } from "../api/organizer";

export default function CreateEvent() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startAt, setStartAt] = useState(""); // datetime-local gives "2026-12-01T10:00"
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createEvent({
        name: name.trim(),
        description: description.trim() || undefined,
        venue: venue.trim(),
        // datetime-local has no timezone, so new Date() reads it as local time;
        // toISOString() converts it to UTC, which is what the backend stores
        start_at: new Date(startAt).toISOString(),
      });
      navigate("/organizer", { replace: true });
    } catch (err) {
      if (isAxiosError<{ error?: string }>(err)) {
        if (!err.response) setError("Cannot connect to the server.");
        else if (err.response.status === 400) setError(err.response.data?.error ?? "Please check the form.");
        else setError("Could not create the event.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50";

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Link to="/organizer" className="text-sm text-indigo-600 hover:text-indigo-800">
        ← Back to my events
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Create event</h1>
      <p className="mt-1 text-sm text-slate-500">It starts as a draft. Add tiers, then publish it.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold text-slate-700">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={submitting} className={inputClass} />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-semibold text-slate-700">Description (optional)</label>
          <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} className={inputClass} />
        </div>

        <div>
          <label htmlFor="venue" className="mb-1 block text-sm font-semibold text-slate-700">Venue</label>
          <input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} required disabled={submitting} className={inputClass} />
        </div>

        <div>
          <label htmlFor="start" className="mb-1 block text-sm font-semibold text-slate-700">Start date and time</label>
          <input id="start" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required disabled={submitting} className={inputClass} />
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create event"}
        </button>
      </form>
    </main>
  );
}