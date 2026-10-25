import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import * as authApi from "./api/auth";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EventList from "./pages/EventList";
import EventDetail from "./pages/EventDetail";
import HoldPage from "./pages/HoldPage";

function App() {
  const [loading, setLoading] = useState(true);
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    authApi
      .fetchMe()
      .then((u) => login(u))
      .catch(() => {}) // 401 just means "not logged in"
      .finally(() => setLoading(false));
  }, [login]);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            {/* temporary logout button, replaced by a navbar later */}
            <div className="flex justify-end p-4">
              <button
                className="rounded bg-slate-800 px-3 py-1 text-white"
                onClick={async () => {
                  await authApi.logout();
                  useAuthStore.getState().logout();
                }}
              >
                Log out
              </button>
            </div>
            <EventList />
          </>
        }
      />
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* placeholder until the hold/countdown page is built */}
     <Route path="/holds/:id" element={<HoldPage />} />
      <Route path="/bookings" element={<p className="p-6">My bookings coming next</p>} />
    </Routes>
  );
}

export default App;