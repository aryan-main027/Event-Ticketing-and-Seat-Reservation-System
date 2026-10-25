import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import * as authApi from "./api/auth";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EventList from "./pages/EventList";
import EventDetail from "./pages/EventDetail";
import HoldPage from "./pages/HoldPage";
import MyHolds from "./pages/MyHolds";
import MyBookings from "./pages/MyBookings";
import OrganizerDashboard from "./pages/OrganizerDashboard";

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
      {/* Login and Register keep their own full-screen design, so no navbar */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Everything inside this route gets the navbar */}
      <Route element={<Layout />}>
        <Route path="/" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />

        <Route
          path="/holds"
          element={
            <ProtectedRoute requiredRole="ATTENDEE">
              <MyHolds />
            </ProtectedRoute>
          }
        />
        <Route
          path="/holds/:id"
          element={
            <ProtectedRoute requiredRole="ATTENDEE">
              <HoldPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute requiredRole="ATTENDEE">
              <MyBookings />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        path="/organizer"
        element={
          <ProtectedRoute requiredRole="ORGANIZER">
            <OrganizerDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;