// src/components/Header.jsx
import { Link, useNavigate } from "react-router-dom";
import {
  FaBox,
  FaTags,
  FaTruck,
  FaUsers,
  FaBell,
  FaExchangeAlt,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { getLixeiraCount } from "../services/api";
import AlertBadge from "./AlertBadge";

const Header = ({ title, btnText, btnPath }) => {
  const [deletedCount, setDeletedCount] = useState(0);
  const navigate = useNavigate();

  // Carrega a contagem ao montar o componente
  useEffect(() => {
    const loadCount = async () => {
      try {
        const result = await getLixeiraCount();
        setDeletedCount(Number(result?.count ?? 0));
      } catch (error) {
        console.error("Erro ao carregar contagem da lixeira:", error);
      }
    };
    loadCount();
  }, []);

  // Função para sair
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login"); // Redireciona para a página de login
    //window.location.href = "/login";
  };
  // const handleLogout = () => {
  // localStorage.removeItem("token"); // Remove o token JWT
  //   navigate("/login"); // Redireciona para a página de login
  // };

  return (
    <header className="bg-white shadow-lg">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-2xl font-bold text-blue-600 flex items-center gap-2"
            >
              <FaBox className="text-blue-600" /> EstoqueApp
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <Link to="/produtos" className="header-link">
                <FaBox className="mr-1" /> Produtos
              </Link>
              <Link to="/marcas" className="header-link">
                <FaTags className="mr-1" /> Marcas
              </Link>
              <Link to="/fornecedores" className="header-link">
                <FaTruck className="mr-1" /> Fornecedores
              </Link>
              <Link to="/familias" className="header-link">
                <FaUsers className="mr-1" /> Famílias
              </Link>
              <Link
                to="/alertas/historico"
                className="header-link text-orange-600 hover:text-orange-800"
              >
                <FaBell className="mr-1" /> Alertas
              </Link>
              <Link
                to="/estoque/lancamento"
                className="header-link text-orange-600 hover:text-orange-800"
              >
                <FaExchangeAlt className="mr-1" /> Mov. Estoque
              </Link>
              <Link
                to="/configuracoes/lancamento"
                className="header-link"
              >
                ⚙ Configurações
              </Link>
              <Link
                to="/produtos/lixeira"
                className="header-link text-red-600 hover:text-red-800 relative"
              >
                <FaTrash className="mr-1" /> Lixeira
                {deletedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {deletedCount}
                  </span>
                )}
              </Link>
              <Link
                to="/admin"
                className="header-link text-orange-600 hover:text-orange-800"
              >
                <FaUserShield className="mr-1" /> Admin
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <AlertBadge />
            {btnText && (
              <Link
                to={btnPath}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {btnText}
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
      <style>{`
        .header-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          color: #4B5563;
          font-weight: 500;
          transition: background 0.2s, color 0.2s;
        }
        .header-link:hover {
          background: #F3F4F6;
          color: #2563EB;
        }
      `}</style>
    </header>
  );
};

export default Header;
