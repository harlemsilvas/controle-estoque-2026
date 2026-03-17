import React from "react";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

const ProdutosTable = ({
  produtos,
  onEdit,
  onDelete,
  onView,
  loading,
  orderBy,
  orderDir,
  setOrderBy,
  setOrderDir,
}) => {
  const renderSortIcon = (col) => {
    if (orderBy === col) {
      return orderDir === "asc" ? (
        <FaSortUp className="inline ml-1" />
      ) : (
        <FaSortDown className="inline ml-1" />
      );
    }
    return <FaSort className="inline ml-1 text-gray-400" />;
  };
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
              onClick={() => {
                if (orderBy === "DESCRICAO")
                  setOrderDir(orderDir === "asc" ? "desc" : "asc");
                else {
                  setOrderBy("DESCRICAO");
                  setOrderDir("asc");
                }
              }}
            >
              <span className="flex items-center gap-1">
                Descrição {renderSortIcon("DESCRICAO")}
              </span>
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Código Interno
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Quantidade
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                Carregando...
              </td>
            </tr>
          ) : produtos.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                Nenhum produto encontrado
              </td>
            </tr>
          ) : (
            produtos.map((produto) => (
              <tr key={produto.CODIGO}>
                <td className="px-4 py-2">{produto.DESCRICAO}</td>
                <td className="px-4 py-2">{produto.CODIGO_INTERNO || "-"}</td>
                <td className="px-4 py-2">
                  {produto.ESTOQUE_ATUAL ?? produto.quantidade ?? "-"}
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    onClick={() => onView(produto.CODIGO)}
                    className="text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    title="Ver Detalhes"
                  >
                    <FaEye size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(produto.CODIGO)}
                    className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Editar"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(produto.CODIGO)}
                    className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Excluir"
                  >
                    <FaTrash size={18} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProdutosTable;
