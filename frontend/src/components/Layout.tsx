
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-gradient-to-br from-slate-50 via-white to-indigo-50/70">
      {/* Ambient background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-40 top-40 -z-0 h-96 w-96 rounded-full bg-indigo-200/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-40 top-[45%] -z-0 h-96 w-96 rounded-full bg-fuchsia-200/20 blur-3xl"
      />

      <Navbar />

      {/* Replay the entrance animation when the route changes */}
      <div
        key={location.pathname}
        className="relative z-0 animate-fade-up motion-reduce:animate-none"
      >
        <Outlet />
      </div>
    </div>
  );
}
