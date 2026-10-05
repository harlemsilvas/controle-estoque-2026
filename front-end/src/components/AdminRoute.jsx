import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export default function AdminRoute({ permission, children }) {
  const { user, can, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const allowed = permission ? can(permission) : user.role === "admin" || user.permissions?.some(p => /^(users|profiles|settings)\./.test(p));
  return allowed ? children : <Navigate to="/conta/acessos" replace />;
}
