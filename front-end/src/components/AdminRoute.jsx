import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  console.log("[AdminRoute] user:", user);
  console.log("[AdminRoute] isAuthenticated:", isAuthenticated);

  if (!isAuthenticated) {
    console.log("[AdminRoute] Não autenticado, redirecionando para login");
    return <Navigate to="/login" />;
  }

  if (!user || user.role !== "admin") {
    console.log(
      "[AdminRoute] Usuário não é admin ou não existe, redirecionando para home"
    );
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
