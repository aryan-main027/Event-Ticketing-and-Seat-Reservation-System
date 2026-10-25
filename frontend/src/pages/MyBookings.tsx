import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBookings, type BookingDetail } from "../api/bookings";

export default function MyBookings() {
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchBookings()
      .then((b) => {
        if (!ignore) setBookings(b);
      })
      .catch(() => {
        if (!ignore) setError("Could not load your bookings");
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
      <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>

      {loading && <p className="mt-6 text-slate-500">Loading...</p>}

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && bookings.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
          You have no bookings yet. <Link to="/" className="text-indigo-600 hover:text-indigo-800">Browse events</Link>
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {bookings.map((b) => (
          <li key={b.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">{b.event_name}</p>
            <p className="text-sm text-slate-600">
              {b.quantity} × {b.tier_name} (₹{b.price} each)
            </p>
            <p className="mt-2 text-sm text-slate-500">
              📍 {b.event_venue} · 🗓️ {new Date(b.event_start_at).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Booked on {new Date(b.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}