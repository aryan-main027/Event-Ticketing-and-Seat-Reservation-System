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

  // UPDATED: FormEvent instead of SubmitEvent, so it compiles on every React types version
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
      // UPDATED: removed console.error(err). It printed the full error object in the
      // browser console on every failed attempt, which is noise for users.
    } finally {
      setSubmitting(false);
    }
  };

  if (user) return <Navigate to="/" replace />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 px-4 py-10">
      <section
        className={`w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 transition-all duration-500 ease-out sm:p-9 motion-reduce:transition-none ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.98] opacity-0"
        }`}
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-200">
            A
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h1>
          <p className="mt-2 text-sm text-slate-500">Join us and get started today.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
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
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
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
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
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
              // UPDATED: the comment now sits above the prop it describes.
              // Client-side minimum length (the backend enforces it too).
              minLength={8}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-2 block text-sm font-semibold text-slate-700">
              Account type
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "ORGANIZER" | "ATTENDEE")}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="ATTENDEE">Attendee</option>
              <option value="ORGANIZER">Organizer</option>
            </select>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 transition-colors hover:text-indigo-800">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}