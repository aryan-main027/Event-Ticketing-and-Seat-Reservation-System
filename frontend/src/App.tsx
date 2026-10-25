import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import * as authApi from "./api/auth";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
// UPDATED: import Register so its route can be added
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [loading, setLoading] = useState(true);
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    authApi
      .fetchMe()
      .then((u) => login(u))
      .catch(() => {}) // 401 just means "not logged in", so stay silent
      .finally(() => setLoading(false));
  }, [login]);

  if (loading) return <p>Loading...</p>;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="p-6">
            <p>Home (events list comes next)</p>
            <button
              className="mt-3 rounded bg-slate-800 px-3 py-1 text-white"
              onClick={async () => {
                await authApi.logout();
                useAuthStore.getState().logout();
              }}
            >
              Log out
            </button>
          </div>
        }
      />
      <Route path="/login" element={<Login />} />
      {/* UPDATED: the missing /register route. Without it the Create account link shows a blank page */}
      <Route path="/register" element={<Register />} />
      <Route
        path="/attendee-test"
        element={
          <ProtectedRoute requiredRole="ATTENDEE">
            <p className="p-6">Attendee only</p>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer-test"
        element={
          <ProtectedRoute requiredRole="ORGANIZER">
            <p>Organizer only</p>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;