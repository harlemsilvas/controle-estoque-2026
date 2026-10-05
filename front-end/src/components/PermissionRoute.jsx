import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export default function PermissionRoute({ permission, children }) {
  const { can, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return can(permission) ? children : <Navigate to="/conta/acessos" replace />;
}
