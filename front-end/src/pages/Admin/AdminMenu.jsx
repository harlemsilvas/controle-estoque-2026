// src/components/AdminMenu.jsx Menu de relatórios totalizadores

import React from "react";
import {
  FaChartBar,
  FaTags,
  FaLeaf,
  FaTruck,
  FaBoxOpen,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const AdminMenu = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-gray-50 min-h-screen p-6 flex flex-col items-center">
      <nav className="w-full max-w-md space-y-4">
        <Link to="/admin/totalizacao" className="admin-link">
          <FaChartBar className="mr-3 text-blue-500" size={22} />
          <span className="text-gray-800 font-medium">
            Totalização do Estoque
          </span>
        </Link>
        <Link to="/admin/totalizacao/marca" className="admin-link">
          <FaTags className="mr-3 text-green-500" size={22} />
          <span className="text-gray-800 font-medium">
            Totalização por Marca
          </span>
        </Link>
        <Link to="/admin/totalizacao/familia" className="admin-link">
          <FaLeaf className="mr-3 text-purple-500" size={22} />
          <span className="text-gray-800 font-medium">
            Totalização por Família
          </span>
        </Link>
        <Link to="/admin/totalizacao/fornecedor" className="admin-link">
          <FaTruck className="mr-3 text-orange-500" size={22} />
          <span className="text-gray-800 font-medium">
            Totalização por Fornecedor
          </span>
        </Link>
        <Link to="/admin/totalizacao/produto" className="admin-link">
          <FaBoxOpen className="mr-3 text-red-500" size={22} />
          <span className="text-gray-800 font-medium">
            Totalização por Produto
          </span>
        </Link>
      </nav>
      <button
        onClick={() => navigate("/")}
        className="mt-10 flex items-center gap-2 px-5 py-3 bg-white rounded-lg shadow hover:bg-gray-100 text-gray-700 font-semibold transition-all"
      >
        <FaArrowLeft className="text-gray-500" size={18} />
        Sair do Painel Admin
      </button>
      <style>{`
        .admin-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.25rem;
          background: #fff;
          border-radius: 0.75rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          font-size: 1rem;
          font-weight: 500;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .admin-link:hover {
          background: #f3f4f6;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  );
};

export default AdminMenu;
