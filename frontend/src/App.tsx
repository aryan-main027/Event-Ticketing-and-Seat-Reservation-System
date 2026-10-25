import { useEffect, useState } from "react";
import * as authApi from "./api/auth";
import { useAuthStore } from "./store/authStore";

function App() {
  const [loading, setLoading] = useState(true);
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    authApi
      .fetchMe()
      .then((u) => {
        console.log("restored user:", u); // temporary, delete later
        login(u);
      })
      .catch(() => {}) // 401: not logged in, stay silent
      .finally(() => setLoading(false));
  }, [login]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <p>Logged in as: {user ? `${user.name} (${user.role})` : "nobody"}</p>
    </div>
  );
}

export default App;