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
      // clear the store even if the request failed, so the UI never stays "logged in"
      logoutStore();
      navigate("/login", { replace: true });
    }
  };

  // NavLink gives us `isActive`, so the current page's link can look highlighted
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold text-indigo-600">
            Ticketing
          </Link>

          <NavLink to="/" end className={linkClass}>
            Events
          </NavLink>

          {user?.role === "ATTENDEE" && (
            <>
              <NavLink to="/holds" className={linkClass}>
                My holds
              </NavLink>
              <NavLink to="/bookings" className={linkClass}>
                My bookings
              </NavLink>
            </>
          )}

          {user?.role === "ORGANIZER" && (
            <NavLink to="/organizer" className={linkClass}>
              Dashboard
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">{user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}