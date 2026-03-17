import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const ProdutosGrid = ({
  produtos,
  onEdit,
  onDelete,
  loading,
  searchTerm,
  setSearchTerm,
}) => {
  // Filtrar produtos com base no termo de busca
  const filteredProducts = produtos.filter(
    (produto) =>
      produto.DESCRICAO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.CODIGO_INTERNO?.toLowerCase().includes(
        searchTerm.toLowerCase(),
      ) ||
      produto.CODIGO_BARRAS?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Lista de Produtos
        </h1>
        <div className="w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar por nome, código ou barras..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((produto) => (
            <div
              key={produto.CODIGO}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {produto.DESCRICAO}
                </h2>
                <p className="text-gray-600">
                  Código: {produto.CODIGO_INTERNO || "N/A"}
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <Link
                    to={`/produto/${produto.CODIGO}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Ver detalhes
                  </Link>
                  <button
                    onClick={() => onEdit(produto.CODIGO)}
                    className="text-gray-600 hover:text-blue-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(produto.CODIGO)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          Nenhum produto encontrado
        </div>
      )}
    </div>
  );
};

ProdutosGrid.propTypes = {
  produtos: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
};

export default ProdutosGrid;
