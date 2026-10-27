
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
        else if (err.response.status === 409)
          setConfirmError(err.response.data?.error ?? "This hold can no longer be confirmed.");
        else setConfirmError("Something went wrong.");
      } else {
        setConfirmError("Something went wrong.");
      }
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl animate-pulse space-y-5">
          <div className="h-8 w-56 rounded-lg bg-violet-100" />
          <div className="h-56 rounded-3xl bg-gradient-to-br from-indigo-100 to-fuchsia-100" />
          <div className="h-12 rounded-xl bg-slate-200" />
          <div className="h-12 rounded-xl bg-slate-200" />
          <p className="text-sm text-slate-500">Loading your reservation...</p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl animate-fade-up rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-violet-100/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-3xl">
            🎟️
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Hold not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This reservation may no longer be available.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Browse events
          </Link>
        </div>
      </main>
    );
  }

  if (error || !hold) {
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl animate-fade-up rounded-2xl border border-red-200 bg-red-50 p-5">
          <p role="alert" className="text-sm text-red-700">
            {error ?? "Could not load this hold"}
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:text-indigo-900"
          >
            ← Back to events
          </Link>
        </div>
      </main>
    );
  }

  const converted = hold.status === "converted";
  const expired = hold.status === "expired" || (hold.status === "active" && secondsLeft === 0);

  // Total length of this hold in seconds, used for the progress bar.
  const totalSeconds = Math.max(
    1,
    Math.round((new Date(hold.expiry_time).getTime() - new Date(hold.created_at).getTime()) / 1000)
  );
  const percent = Math.min(100, (secondsLeft / totalSeconds) * 100);

  // Green when plenty of time, amber under 3 minutes, red under 1 minute.
  const urgency =
    secondsLeft > 180
      ? { text: "text-emerald-600", bar: "bg-emerald-500", ring: "ring-emerald-100" }
      : secondsLeft > 60
      ? { text: "text-amber-600", bar: "bg-amber-500", ring: "ring-amber-100" }
      : { text: "text-red-600", bar: "bg-red-500", ring: "ring-red-100" };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl animate-fade-up">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-violet-700"
        >
          <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
          Back to events
        </Link>

        {/* Header */}
        <section className="relative isolate mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-800 p-6 text-white shadow-xl shadow-violet-200/50 sm:p-9">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-1/4 -z-10 h-48 w-48 rounded-full bg-indigo-400/30 blur-3xl"
          />

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
              >
                <path d="M3 8a2 2 0 0 0 0 4v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2Z" />
                <path d="M13 5v2m0 3v2m0 3v2" />
              </svg>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                Almost there
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Your reservation
              </h1>
              <p className="mt-3 text-sm leading-6 text-indigo-100 sm:text-base">
                Your tickets are being held while you complete your booking.
              </p>
            </div>
          </div>
        </section>

        {/* Reservation summary */}
        <section className="mt-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Tickets reserved
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">
                {hold.quantity} ticket{hold.quantity > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Ticket tier #{hold.tier_id}
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-100 text-violet-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
              >
                <path d="M3 8a2 2 0 0 0 0 4v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2Z" />
                <path d="M13 5v2m0 3v2m0 3v2" />
              </svg>
            </div>
          </div>
        </section>

        {/* Countdown */}
        <section className={`mt-5 rounded-3xl border bg-white p-6 shadow-sm transition-colors duration-500 sm:p-8 ${expired ? "border-red-200" : converted ? "border-emerald-200" : "border-slate-200/80"}`}>
          {converted ? (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-8 w-8"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-emerald-700">
                Booking confirmed!
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                This reservation has already been confirmed.
              </p>
            </div>
          ) : expired ? (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-8 w-8"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-red-700">
                Reservation expired
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                The hold has expired and the tickets have been released.
                Browse events to find another available option.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Time left to confirm
                </p>
                <p
                  aria-live="off"
                  className={`mt-4 font-mono text-6xl font-black tracking-tight transition-colors duration-500 sm:text-7xl ${urgency.text} ${secondsLeft <= 60 ? "animate-pulse" : ""}`}
                >
                  {minutes}:{seconds}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Complete your booking before the timer reaches zero.
                </p>
              </div>

              <div
                className={`mt-7 rounded-full bg-slate-100 p-1 ring-4 transition-colors duration-500 ${urgency.ring}`}
              >
                <div className="h-3 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${urgency.bar}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Hold started</span>
                <span>Time remaining</span>
              </div>
            </>
          )}
        </section>

        {confirmError && (
          <p
            role="alert"
            className="mt-5 animate-fade-up rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {confirmError}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleConfirm}
            disabled={confirming || expired || converted}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl active:scale-[0.98] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none motion-reduce:transition-none"
          >
            {confirming ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Confirming booking...
              </>
            ) : converted ? (
              "Already confirmed"
            ) : expired ? (
              "Reservation expired"
            ) : (
              <>
                Confirm booking
                <span aria-hidden="true" className="text-lg">→</span>
              </>
            )}
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-600 transition duration-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 motion-reduce:transition-none"
          >
            Browse events
          </Link>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Your reservation is temporary until the booking is confirmed.
        </p>
      </div>
    </main>
  );
}
