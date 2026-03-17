import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // Se o token não existir, redireciona para a página de login
    return <Navigate to="/login" />;
  }

  // if (!token) {
  //   // Redirecionar para a página de login se o token não existir
  //   return <Navigate to="/login" />;
  // }

  return children;
};

export default ProtectedRoute;
