// src/pages/AdminTotalizacaoFamilia.jsx
import React, { useEffect, useState } from "react";

const AdminTotalizacaoFamilia = () => {
  const [familias, setFamilias] = useState([]);

  useEffect(() => {
    console.log("Iniciando requisição para /estoque/valor-total-por-familia");

    fetch("/estoque/valor-total-por-familia")
      .then((response) => {
        console.log("Resposta recebida da API:", response);
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        return response.json(); // Converta diretamente para JSON
      })
      .then((data) => {
        console.log("Dados recebidos da API:", data);
        setFamilias(data);
      })
      .catch((error) => {
        console.error("Erro ao buscar totalização por família:", error);
      });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Totalização por Família</h1>
      <ul className="space-y-2">
        {familias.map((familia, index) => (
          <li
            key={index}
            className="flex justify-between items-center bg-gray-100 p-2 rounded"
          >
            <span>{familia.Familia}</span>
            <span className="font-bold text-blue-600">
              R$ {familia.ValorTotal.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminTotalizacaoFamilia;
