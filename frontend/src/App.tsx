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
import CreateEvent from "./pages/CreateEvent";
import ManageEvent from "./pages/ManageEvent";

function App() {
  const [loading, setLoading] = useState(true);
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    authApi
      .fetchMe()
      .then((user) => login(user))
      .catch(() => {
        // A failed authentication check can mean the user is logged out.
      })
      .finally(() => {
        setLoading(false);
      });
  }, [login]);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <Routes>
      {/* Authentication pages use their own layouts. */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Shared navbar and layout for attendee-facing pages. */}
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

      {/* Organizer pages. */}
      <Route
        path="/organizer"
        element={
          <ProtectedRoute requiredRole="ORGANIZER">
            <OrganizerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizer/new"
        element={
          <ProtectedRoute requiredRole="ORGANIZER">
            <CreateEvent />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizer/events/:id"
        element={
          <ProtectedRoute requiredRole="ORGANIZER">
            <ManageEvent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;