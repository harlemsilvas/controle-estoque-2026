// src/pages/AdminTotalizacaoFornecedor.jsx
import React, { useEffect, useState } from "react";

const AdminTotalizacaoFornecedor = () => {
  const [fornecedores, setFornecedores] = useState([]);

  useEffect(() => {
    fetch("/estoque/valor-total-por-fornecedor")
      .then((response) => response.json())
      .then((data) => setFornecedores(data))
      .catch((error) =>
        console.error("Erro ao buscar totalização por fornecedor:", error)
      );
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Totalização por Fornecedor</h1>
      <ul className="space-y-2">
        {fornecedores.map((fornecedor, index) => (
          <li
            key={index}
            className="flex justify-between items-center bg-gray-100 p-2 rounded"
          >
            <span>{fornecedor.Fornecedor}</span>
            <span className="font-bold text-blue-600">
              R$ {fornecedor.ValorTotal.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminTotalizacaoFornecedor;
