
import { Link, NavLink, useNavigate } from "react-router-dom";
import * as authApi from "../api/auth";
import { useAuthStore } from "../store/authStore";

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // clears the cookie on the server
      await authApi.logout();
    } finally {
      // clear the store even if the request failed
      logoutStore();
      navigate("/login", { replace: true });
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/85 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
      >
        {/* Brand and primary navigation */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className="group mr-1 flex shrink-0 items-center gap-2.5"
            aria-label="Ticketing home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-lg font-black text-white shadow-lg shadow-indigo-600/20 transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
              T
            </span>
            <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 sm:inline">
              Ticketing
              <span className="text-indigo-600">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Events
            </NavLink>

            {user?.role === "ATTENDEE" && (
              <>
                <NavLink to="/holds" className={linkClass}>
                  <span className="hidden sm:inline">My holds</span>
                  <span className="sm:hidden">Holds</span>
                </NavLink>

                <NavLink to="/bookings" className={linkClass}>
                  <span className="hidden sm:inline">My bookings</span>
                  <span className="sm:hidden">Bookings</span>
                </NavLink>
              </>
            )}

            {user?.role === "ORGANIZER" && (
              <NavLink to="/organizer" className={linkClass}>
                Dashboard
              </NavLink>
            )}
          </div>
        </div>

        {/* Account actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <div className="hidden items-center gap-2.5 md:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700 ring-1 ring-indigo-200/70">
                  {user.name?.trim().charAt(0).toUpperCase() || "U"}
                </span>

                <div className="max-w-36">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user.role === "ORGANIZER" ? "Organizer" : "Attendee"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-4"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path
                    d="M10 17l5-5-5-5M15 12H3m9-8h5a2 2 0 012 2v12a2 2 0 01-2 2h-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Log out</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:px-4"
              >
                Sign up
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-4 w-4"
                >
                  <path
                    d="M4 10h12m-5-5l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
