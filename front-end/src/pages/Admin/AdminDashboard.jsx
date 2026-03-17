// src/pages/AdminDashboard.jsx
// import React, { useEffect, useState } from "react";
import React from "react";
import { useAuth } from "../../hooks/useAuth";

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Painel do Usuário</h1>
      {user ? (
        <p>
          Usuário Logado:{" "}
          <strong>{user?.username || "Não identificado"}</strong>
        </p>
      ) : (
        <p>Usuário Logado: Não identificado</p>
      )}
    </div>
  );
};

export default AdminDashboard;
