import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: React.ReactNode;
  requiredRole?: "ORGANIZER" | "ATTENDEE";
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const user = useAuthStore((s) => s.user);

  // 1. no user -> <Navigate to="/login" replace />
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // 2. requiredRole given and user.role differs -> <Navigate to="/" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  // 3. otherwise -> <>{children}</>
  return <>{children}</>;
}
