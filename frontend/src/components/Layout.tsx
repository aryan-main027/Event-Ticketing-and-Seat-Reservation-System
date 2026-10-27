import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100">
      <Navbar />
      {/* key changes on every navigation, so React replays the animation for each new page */}
      <div key={location.pathname} className="animate-fade-up motion-reduce:animate-none">
        <Outlet />
      </div>
    </div>
  );
}