// src/components/PrivateRoute.jsx - rota admin
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // Ajuste o caminho conforme necessário
  

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  // console.log("🚀 ~ PrivateRoute ~ isAuthenticated:", isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" />; // Redireciona para a página de login
  }

  return children;
};

export default PrivateRoute;
