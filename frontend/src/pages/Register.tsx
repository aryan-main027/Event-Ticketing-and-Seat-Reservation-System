
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import * as authApi from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { isAxiosError } from "axios";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ORGANIZER" | "ATTENDEE">("ATTENDEE");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      navigate("/login", { replace: true });
    } catch (err: unknown) {
      if (isAxiosError<{ error?: string }>(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.error;

        if (status === 400) {
          setError(message ?? "Please check the information you entered.");
        } else if (status === 409) {
          setError(message ?? "An account with this email already exists.");
        } else if (status === 429) {
          setError(message ?? "Too many requests. Please try again later.");
        } else if (!err.response) {
          setError("Cannot connect to the server. Please try again.");
        } else {
          setError(message ?? "Unable to create your account.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (user) return <Navigate to="/" replace />;

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-100/70 px-4 py-10 sm:px-6">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-fuchsia-200/40 blur-3xl"
      />

      <section
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-2xl shadow-indigo-950/[0.08] backdrop-blur-xl transition-all duration-500 ease-out sm:p-9 motion-reduce:transition-none ${
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-[0.98] opacity-0"
        }`}
      >
        {/* Top accent */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

        {/* Heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/25">
            A
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-700">
            JOIN THE COMMUNITY
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Create an account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your next great experience starts here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Full name
            </label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={submitting}
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={submitting}
              className={inputClass}
            />
            <p className="mt-2 text-xs text-slate-400">
              Use at least 8 characters.
            </p>
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Account type
            </label>

            <select
              id="role"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "ORGANIZER" | "ATTENDEE")
              }
              disabled={submitting}
              className={inputClass}
            >
              <option value="ATTENDEE">Attendee</option>
              <option value="ORGANIZER">Organizer</option>
            </select>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              {role === "ORGANIZER"
                ? "Create and manage events for your audience."
                : "Discover events and reserve your tickets."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
                !
              </span>
              <p className="pt-0.5">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 motion-reduce:transition-none"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        {/* Sign in */}
        <div className="mt-7 border-t border-slate-100 pt-6 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 transition-colors hover:text-violet-700 focus:outline-none focus:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          By creating an account, you can start exploring events.
        </p>
      </section>
    </main>
  );
}
