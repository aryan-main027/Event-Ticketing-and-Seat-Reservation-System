import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { fetchHold, type HoldDetail } from "../api/holds";
import { confirmBooking } from "../api/bookings";
import { useCountdown } from "../hooks/useCountdown";

export default function HoldPage() {
  const { id } = useParams();
  const holdId = Number(id);
  const validId = Number.isInteger(holdId) && holdId > 0;
  const navigate = useNavigate();

  const [hold, setHold] = useState<HoldDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const secondsLeft = useCountdown(hold ? hold.expiry_time : null);

  useEffect(() => {
    if (!validId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let ignore = false;
    setLoading(true);

    fetchHold(holdId)
      .then((h) => {
        if (!ignore) setHold(h);
      })
      .catch((err) => {
        if (ignore) return;
        if (isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 401)) {
          setNotFound(true);
        } else {
          setError("Could not load this hold");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [holdId, validId]);

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      await confirmBooking(holdId);
      navigate("/bookings", { replace: true });
    } catch (err) {
      if (isAxiosError<{ error?: string }>(err)) {
        if (!err.response) setConfirmError("Cannot connect to the server.");
        else if (err.response.status === 409) setConfirmError(err.response.data?.error ?? "This hold can no longer be confirmed.");
        else setConfirmError("Something went wrong.");
      } else {
        setConfirmError("Something went wrong.");
      }
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <p className="p-6 text-slate-500">Loading...</p>;

  if (notFound) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <p className="text-lg font-semibold text-slate-900">Hold not found</p>
        <Link to="/" className="mt-3 inline-block text-indigo-600 hover:text-indigo-800">Back to events</Link>
      </main>
    );
  }

  if (error || !hold) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "Could not load this hold"}
        </p>
      </main>
    );
  }

  const active = hold.status === "active";
  const expired = !active ? hold.status === "expired" : secondsLeft === 0;
  const converted = hold.status === "converted";

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Your reservation</h1>
      <p className="mt-2 text-slate-600">
        {hold.quantity} ticket{hold.quantity > 1 ? "s" : ""} held for tier #{hold.tier_id}.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center">
        {converted ? (
          <p className="font-medium text-green-700">This hold is already confirmed.</p>
        ) : expired ? (
          <p className="font-medium text-red-700">This hold has expired. The tickets were released.</p>
        ) : (
          <>
            <p className="text-sm text-slate-500">Time left to confirm</p>
            <p className="mt-1 font-mono text-4xl font-bold text-slate-900">{minutes}:{seconds}</p>
          </>
        )}
      </div>

      {confirmError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{confirmError}</p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleConfirm}
          disabled={confirming || expired || converted}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {confirming ? "Confirming..." : "Confirm booking"}
        </button>
        <Link to="/" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Back to events
        </Link>
      </div>
    </main>
  );
}