// src/pages/dmin/AlertasHistorico.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { getAlertasHistorico, resolveAlerta } from "../services/api";
import AdminUsuarios from "./Admin/AdminUsuarios";

const AlertasHistorico = () => {
  const [alertas, setAlertas] = useState([]);

  const fetchAlertas = async () => {
    const data = await getAlertasHistorico();
    setAlertas(data);
  };

  useEffect(() => {
    fetchAlertas();
  }, []);

  const handleResolver = async (id) => {
    try {
      await resolveAlerta(id, "admin");
      await fetchAlertas();
    } catch (err) {
      alert("Erro ao resolver alerta: " + (err.message || err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Histórico de Alertas
        </h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estoque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alertas.map((alerta) => (
                <tr key={alerta.ID}>
                  <td className="px-6 py-4">{alerta.PRODUTO_DESCRICAO}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        alerta.STATUS === "ativo"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {alerta.ESTOQUE_ATUAL} / {alerta.ESTOQUE_MINIMO}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(alerta.DATA_CRIACAO).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        alerta.STATUS === "ativo"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {alerta.STATUS}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {alerta.STATUS === "ativo" ? (
                      <button
                        className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                        onClick={() => handleResolver(alerta.ID)}
                        title="Marcar como resolvido"
                      >
                        Resolver
                      </button>
                    ) : (
                      <span className="text-gray-400">Resolvido</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlertasHistorico;
