import React, { useEffect, useState } from "react";
import { buildApiUrl } from "../../config/apiBaseUrl";

const AdminRelatorioMarcas = () => {
  const [data, setData] = useState(null); // Estado para armazenar os dados da API
  const [loading, setLoading] = useState(true); // Estado para controlar o carregamento
  const [error, setError] = useState(null); // Estado para capturar erros

  useEffect(() => {
    // Função para buscar os dados da API
    const fetchData = async () => {
      try {
        const response = await fetch(buildApiUrl("/produto-aggregate"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Se houver autenticação via token
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar dados da API");
        }

        const result = await response.json();
        setData(result); // Armazena os dados no estado
      } catch (err) {
        setError(err.message); // Captura o erro
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    fetchData(); // Chama a função para buscar os dados
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold text-gray-700">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold text-red-600">Erro: {error}</p>
      </div>
    );
  }

  // Mapeamento para camelCase
  const byMarca = (data?.byMarca || []).map((item) => ({
    marca: item.MARCA || item.marca,
    total: item.total,
    valorTotalEstoque:
      item.ValorTotalEstoque ||
      item.valortotalestoque ||
      item.valorTotalEstoque,
  }));

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Título */}
      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        Dados Agregados dos Produtos - Marcas
      </h1>

      {/* Exibição dos dados por Marca */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Por Marca</h2>
        <div className="overflow-x-auto w-[100%]">
          <table className="min-w-full bg-white border border-gray-300 w-[100%]">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border-b w-[60%] text-center">
                  Marca
                </th>
                <th className="py-2 px-4 border-b w-[20%] text-left">
                  Qtde Total
                </th>
                <th className="py-2 px-4 border-b w-[20%] text-right">
                  Valor Total
                </th>
              </tr>
            </thead>
            <tbody>
              {byMarca.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b w-[60%] text-left">
                    {item.marca}
                  </td>
                  <td className="py-2 px-4 border-b w-[60%] text-left">
                    {item.total}
                  </td>
                  <td className="py-2 px-4 border-b w-[60%] text-right">
                    R$ {item.valorTotalEstoque?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border-b w-[60%] text-left">
                  Total de Produtos:
                </th>
                <th className="py-2 px-4 border-b w-[20%] text-left"></th>
                <th className="py-2 px-6 border-b w-[60%] text-right">
                  R${" "}
                  {byMarca
                    .reduce(
                      (acc, item) => acc + (item.valorTotalEstoque || 0),
                      0
                    )
                    .toFixed(2)}
                </th>
              </tr>
            </thead>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRelatorioMarcas;
