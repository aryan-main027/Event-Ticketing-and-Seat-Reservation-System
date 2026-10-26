import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { createTier, fetchStats, type TierStats } from "../api/organizer";

export default function ManageEvent() {
  const { id } = useParams();
  const eventId = Number(id);
  const validId = Number.isInteger(eventId) && eventId > 0;

  const [tiers, setTiers] = useState<TierStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // useCallback so we can call load() again after adding a tier
  const load = useCallback(async () => {
    try {
      setTiers(await fetchStats(eventId));
      setError(null);
    } catch (err) {
      if (isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 404)) {
        setError("Event not found");
      } else {
        setError("Could not load this event");
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!validId) {
      setError("Event not found");
      setLoading(false);
      return;
    }
    load();
  }, [validId, load]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await createTier(eventId, {
        name: name.trim(),
        price: Number(price),
        total_quantity: Number(quantity),
      });
      setName("");
      setPrice("");
      setQuantity("");
      await load(); // refresh the list
    } catch (err) {
      if (isAxiosError<{ error?: string }>(err)) {
        setFormError(err.response?.data?.error ?? "Could not add the tier.");
      } else {
        setFormError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/organizer" className="text-sm text-indigo-600 hover:text-indigo-800">
        ← Back to my events
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Tiers and sales</h1>

      {loading && <p className="mt-6 text-slate-500">Loading...</p>}

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && (
        <>
          {tiers.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-slate-300 py-8 text-center text-slate-500">
              No tiers yet. Add one below.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {tiers.map((t) => (
                <li key={t.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
                    <div><p className="text-slate-400">Total</p><p className="font-semibold">{t.total_quantity}</p></div>
                    <div><p className="text-slate-400">Available</p><p className="font-semibold">{t.available_quantity}</p></div>
                    <div><p className="text-slate-400">Held</p><p className="font-semibold">{t.held}</p></div>
                    <div><p className="text-slate-400">Sold</p><p className="font-semibold">{t.sold}</p></div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAdd} className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">Add a tier</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input placeholder="Name (e.g. VIP)" value={name} onChange={(e) => setName(e.target.value)} required disabled={submitting} className={inputClass} />
              <input type="number" min={0} step="0.01" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required disabled={submitting} className={inputClass} />
              <input type="number" min={1} step={1} placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required disabled={submitting} className={inputClass} />
            </div>

            {formError && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Adding..." : "Add tier"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}