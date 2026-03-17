// src/components/admin/AdminLayout.jsx
import React, { useContext, useState } from "react";
import {
  FaTachometerAlt,
  FaChartBar,
  FaUsers,
  FaTags,
  FaCog,
  FaBarcode,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx"; // Ajuste o caminho conforme necessário
import { useAuth } from "../../hooks/useAuth";

const AdminLayout = () => {
  const { logout } = useContext(AuthContext); // Contexto de autenticação
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isReportsOpen, setIsReportsOpen] = useState(false); // Estado para controlar o dropdown

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return <div>Carregando...</div>; // Exibe um indicador de carregamento
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
            <FaTachometerAlt className="mr-2" /> Painel Administrativo
          </h1>
          <nav className="flex items-center gap-4">
            <Link to="/admin" className="admin-nav-link">
              <FaTachometerAlt className="mr-1" /> Dashboard
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setIsReportsOpen(true)}
              onMouseLeave={() => setIsReportsOpen(false)}
            >
              <button className="admin-nav-link flex items-center">
                <FaChartBar className="mr-1" /> Relatórios{" "}
                <FaChevronDown className="ml-1" />
              </button>
              {isReportsOpen && (
                <div
                  className="absolute top-full left-0 pt-2 w-56 z-10"
                  onMouseEnter={() => setIsReportsOpen(true)}
                  onMouseLeave={() => setIsReportsOpen(false)}
                >
                  <div className="bg-white text-gray-800 rounded-lg shadow-lg py-2">
                    <Link
                      to="/admin/relatorios/marcas"
                      className="admin-dropdown-link"
                    >
                      <FaTags className="mr-2 text-green-500" /> Marcas
                    </Link>
                    <Link
                      to="/admin/relatorios/fornecedores"
                      className="admin-dropdown-link"
                    >
                      <FaUsers className="mr-2 text-orange-500" /> Fornecedores
                    </Link>
                    <Link
                      to="/admin/relatorios/familias"
                      className="admin-dropdown-link"
                    >
                      <FaUsers className="mr-2 text-purple-500" /> Famílias
                    </Link>
                    <Link
                      to="/admin/relatorios/movimentacoes"
                      className="admin-dropdown-link"
                    >
                      <FaTags className="mr-2 text-green-500" /> Movimentações
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link to="/admin/usuarios" className="admin-nav-link">
              <FaUsers className="mr-1" /> Usuários
            </Link>
            <Link to="/admin/etiquetas" className="admin-nav-link">
              <FaBarcode className="mr-1" /> Etiquetas
            </Link>
            <Link to="/admin/totalizacao" className="admin-nav-link">
              <FaChartBar className="mr-1" /> Totais
            </Link>
            <Link to="/admin/configuracoes" className="admin-nav-link">
              <FaCog className="mr-1" /> Configurações
            </Link>
            <button
              onClick={handleLogout}
              className="admin-nav-link text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-1"
            >
              <FaSignOutAlt /> Sair
            </button>
          </nav>
        </div>
        <style>{`
          .admin-nav-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            color: #2563EB;
            font-weight: 500;
            background: transparent;
            transition: background 0.2s, color 0.2s;
          }
          .admin-nav-link:hover {
            background: #F3F4F6;
            color: #1D4ED8;
          }
          .admin-dropdown-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            color: #374151;
            font-weight: 500;
            background: transparent;
            transition: background 0.2s, color 0.2s;
          }
          .admin-dropdown-link:hover {
            background: #F3F4F6;
            color: #2563EB;
          }
        `}</style>
      </header>

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
