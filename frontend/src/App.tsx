import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import * as authApi from "./api/auth";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";

function App() {
  const [loading, setLoading] = useState(true);
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    authApi
      .fetchMe()
      .then((u) => login(u))
      .catch(() => {})
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
    </Routes>
  );
}

export default App;