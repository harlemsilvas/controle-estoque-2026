// src/components/admin/AdminLayout.jsx
import React from "react";
import Header from "../Header";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const AdminLayout = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Carregando...</div>; // Exibe um indicador de carregamento
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header title="Painel Administrativo" />

      {/* Conteúdo Principal */}
      <main className="flex-1 container mx-auto p-6 bg-white rounded-lg shadow-md my-4">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 text-center">
        <div className="container mx-auto">
          <p>
            Usuário Logado:{" "}
            <strong>{user?.username || "Não identificado"}</strong>
          </p>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Sistema de Gestão de Estoque
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;
