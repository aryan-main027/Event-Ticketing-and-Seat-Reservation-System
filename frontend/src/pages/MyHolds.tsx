import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHolds, type HoldDetail } from "../api/holds";

export default function MyHolds() {
  const [holds, setHolds] = useState<HoldDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchHolds()
      .then((h) => {
        if (!ignore) setHolds(h);
      })
      .catch(() => {
        if (!ignore) setError("Could not load your holds");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">My holds</h1>

      {loading && <p className="mt-6 text-slate-500">Loading...</p>}

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && holds.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
          You have no holds.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {holds.map((h) => {
          // "active" in the database can still be out of time until cron runs,
          // so in_time (computed by the database clock) decides what we show.
          const live = h.status === "active" && h.in_time;
          const label = h.status === "converted" ? "Confirmed" : live ? "Active" : "Expired";

          return (
            <li key={h.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-medium text-slate-900">
                  {h.quantity} ticket{h.quantity > 1 ? "s" : ""} · tier #{h.tier_id}
                </p>
                <p className="text-xs text-slate-400">
                  Created {new Date(h.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {label}
                </span>
                {live && (
                  <Link to={`/holds/${h.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    Open
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}