// src/pages/AdminTotalizacaoMarca.jsx
import React, { useEffect, useState } from "react";

const AdminTotalizacaoMarca = () => {
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    fetch("/estoque/valor-total-por-marca")
      .then((response) => response.json())
      .then((data) => setMarcas(data))
      .catch((error) =>
        console.error("Erro ao buscar totalização por marca:", error)
      );
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Totalização por Marca</h1>
      <ul className="space-y-2">
        {marcas.map((marca, index) => (
          <li
            key={index}
            className="flex justify-between items-center bg-gray-100 p-2 rounded"
          >
            <span>{marca.Marca}</span>
            <span className="font-bold text-blue-600">
              R$ {marca.ValorTotal.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminTotalizacaoMarca;
