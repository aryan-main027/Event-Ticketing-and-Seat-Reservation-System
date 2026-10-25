import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {/* Outlet is where the matched child page renders */}
      <Outlet />
    </div>
  );
}