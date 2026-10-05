import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export default function ProtectedRoute({ children }) {
  return useAuth().isAuthenticated ? children : <Navigate to="/login" replace />;
}
