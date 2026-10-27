
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

  // Reload the tier statistics after adding a tier.
  const load = useCallback(async () => {
    try {
      setTiers(await fetchStats(eventId));
      setError(null);
    } catch (err) {
      if (
        isAxiosError(err) &&
        (err.response?.status === 403 || err.response?.status === 404)
      ) {
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

      await load();
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
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70";

  const stats = [
    { key: "total", label: "Total", color: "text-slate-900" },
    { key: "available", label: "Available", color: "text-emerald-700" },
    { key: "held", label: "Held", color: "text-amber-700" },
    { key: "sold", label: "Sold", color: "text-indigo-700" },
  ] as const;

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
        {/* Back navigation */}
        <Link
          to="/organizer"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-x-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <span aria-hidden="true">←</span>
          Back to my events
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
              Tiers and sales
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
              Manage ticket categories, track availability, and monitor sales
              for your event.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 border-t border-white/15 pt-5 text-sm text-indigo-100/80">
              <span className="rounded-lg bg-white/10 px-3 py-2">
                {tiers.length} {tiers.length === 1 ? "ticket tier" : "ticket tiers"}
              </span>
              <span className="rounded-lg bg-white/10 px-3 py-2">
                Event ID: {validId ? eventId : "—"}
              </span>
            </div>
          </div>
        </section>

        {/* Loading state */}
        {loading && (
          <section
            aria-live="polite"
            className="animate-fade-up rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm font-medium text-slate-600">
                Loading ticket tiers...
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </section>
        )}

        {/* Event loading error */}
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
                  Unable to load event
                </h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    void load();
                  }}
                  className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Try again
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Tier list and creation form */}
        {!loading && !error && (
          <div className="space-y-8">
            {/* Ticket tiers */}
            <section className="animate-fade-up">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Ticket tiers
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review ticket inventory and sales for each category.
                  </p>
                </div>
              </div>

              {tiers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-indigo-200 bg-white/80 px-6 py-12 text-center shadow-sm sm:py-16">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-fuchsia-100 text-3xl">
                    🎟️
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    No ticket tiers yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Create your first ticket tier below to start organizing
                    inventory for your event.
                  </p>
                </div>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {tiers.map((t, index) => (
                    <li
                      key={t.id}
                      style={{ animationDelay: `${index * 70}ms` }}
                      className="group animate-fade-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/[0.06]"
                    >
                      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

                      <div className="p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-xl">
                              🎫
                            </div>
                            <div className="min-w-0">
                              <h3 className="break-words text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-700">
                                {t.name}
                              </h3>
                              <p className="mt-1 text-xs text-slate-400">
                                Tier #{t.id}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          {stats.map((stat) => {
                            const value =
                              stat.key === "total"
                                ? t.total_quantity
                                : stat.key === "available"
                                  ? t.available_quantity
                                  : stat.key === "held"
                                    ? t.held
                                    : t.sold;

                            return (
                              <div
                                key={stat.key}
                                className="rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                              >
                                <p className="text-xs font-medium text-slate-500">
                                  {stat.label}
                                </p>
                                <p
                                  className={`mt-1 text-2xl font-bold tabular-nums ${stat.color}`}
                                >
                                  {value}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Add ticket tier */}
            <section className="animate-fade-up overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-fuchsia-50/70 px-5 py-5 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl text-white shadow-md shadow-indigo-600/20">
                    +
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Add a tier
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Create a ticket category with its price and quantity.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAdd} className="space-y-5 p-5 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="tier-name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Tier name
                    </label>
                    <input
                      id="tier-name"
                      placeholder="e.g. VIP"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={submitting}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tier-price"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Price
                    </label>
                    <input
                      id="tier-price"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="e.g. 499"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      disabled={submitting}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tier-quantity"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Quantity
                    </label>
                    <input
                      id="tier-quantity"
                      type="number"
                      min={1}
                      step={1}
                      placeholder="e.g. 100"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      disabled={submitting}
                      className={inputClass}
                    />
                  </div>
                </div>

                {formError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {formError}
                  </p>
                )}

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-400">
                    Double-check the ticket name, price, and available quantity
                    before adding it.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Adding tier...
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">+</span>
                        Add tier
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
