
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
    <main className="relative mx-auto min-h-screen max-w-5xl overflow-hidden px-4 py-8 sm:px-6 lg:py-12">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-20 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-32 h-80 w-80 rounded-full bg-fuchsia-200/30 blur-3xl"
      />

      <div className="relative">
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
              TICKET RESERVATIONS
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              My holds
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
              Keep track of your reserved tickets and check which reservations
              are still active.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 border-t border-white/15 pt-5 text-sm text-indigo-100/80">
              <span className="rounded-lg bg-white/10 px-3 py-2">
                {holds.length} {holds.length === 1 ? "reservation" : "reservations"}
              </span>

              <Link
                to="/"
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 font-medium transition hover:bg-white/20"
              >
                Browse events →
              </Link>
            </div>
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <section
            aria-live="polite"
            className="animate-fade-up rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm font-medium text-slate-600">
                Loading your reservations...
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <section
            role="alert"
            className="animate-fade-up rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
                !
              </span>
              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load reservations
                </h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && !error && holds.length === 0 && (
          <section className="animate-fade-up rounded-3xl border border-dashed border-indigo-200 bg-white/80 px-6 py-14 text-center shadow-sm sm:py-20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-fuchsia-100 text-3xl">
              🎟️
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No reservations yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              When you reserve tickets, your holds will appear here so you can
              check their status and continue to checkout when available.
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Browse events
              <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}

        {/* Reservation cards */}
        {!loading && !error && holds.length > 0 && (
          <section className="animate-fade-up">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Your reservations
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View reservation details and continue with active holds.
              </p>
            </div>

            <ul className="grid gap-4 md:grid-cols-2">
              {holds.map((h, index) => {
                // The database-computed in_time determines whether
                // an active hold is still within its reservation window.
                const live = h.status === "active" && h.in_time;
                const label =
                  h.status === "converted"
                    ? "Confirmed"
                    : live
                      ? "Active"
                      : "Expired";

                const statusStyle =
                  h.status === "converted"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : live
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-slate-100 text-slate-600";

                const dotStyle =
                  h.status === "converted"
                    ? "bg-emerald-500"
                    : live
                      ? "bg-indigo-500"
                      : "bg-slate-400";

                return (
                  <li
                    key={h.id}
                    style={{ animationDelay: `${index * 70}ms` }}
                    className="group animate-fade-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/[0.06]"
                  >
                    <div
                      className={`h-1.5 ${
                        h.status === "converted"
                          ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                          : live
                            ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            : "bg-gradient-to-r from-slate-300 to-slate-400"
                      }`}
                    />

                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-xl">
                            🎫
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                              Reservation #{h.id}
                            </p>
                            <h3 className="mt-1 text-lg font-bold text-slate-900">
                              {h.quantity} ticket{h.quantity > 1 ? "s" : ""}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyle}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${dotStyle}`}
                          />
                          {label}
                        </span>
                      </div>

                      <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Ticket tier
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          Tier #{h.tier_id}
                        </p>
                      </div>

                      <div className="mt-4 flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          🗓️
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-400">
                            Reservation created
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-slate-700">
                            {new Date(h.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-4">
                        {live ? (
                          <Link
                            to={`/holds/${h.id}`}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/15 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            Open reservation
                            <span aria-hidden="true">→</span>
                          </Link>
                        ) : (
                          <p className="text-center text-xs text-slate-400">
                            {h.status === "converted"
                              ? "This reservation has been confirmed."
                              : "This reservation is no longer active."}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
