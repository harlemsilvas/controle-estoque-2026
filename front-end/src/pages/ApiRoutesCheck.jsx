import React, { useEffect, useState } from "react";
import { buildApiUrl } from "../config/apiBaseUrl";

const ROUTES = [
  { name: "Produtos", url: buildApiUrl("/produto") },
  { name: "Fornecedores", url: buildApiUrl("/fornecedor") },
  { name: "Marcas", url: buildApiUrl("/marca") },
  { name: "Famílias", url: buildApiUrl("/familia") },
  { name: "Totais", url: buildApiUrl("/totais") },
  {
    name: "Histórico de Alertas",
    url: buildApiUrl("/alertas/historico"),
  },
  { name: "Usuários", url: buildApiUrl("/usuarios") },
  // Adicione outras rotas GET públicas aqui
];

export default function ApiRoutesCheck() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    async function checkRoutes() {
      const checks = await Promise.all(
        ROUTES.map(async (route) => {
          try {
            const res = await fetch(route.url);
            const json = await res.json();
            return {
              ...route,
              status: res.status,
              ok: res.ok,
              json,
            };
          } catch (err) {
            return {
              ...route,
              status: "Erro",
              ok: false,
              json: String(err),
            };
          }
        })
      );
      setResults(checks);
    }
    checkRoutes();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Validação das Rotas GET da API
      </h1>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Rota</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Retorno</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.url} className={r.ok ? "bg-green-50" : "bg-red-50"}>
              <td className="p-2 border font-medium">{r.name}</td>
              <td className="p-2 border">{r.status}</td>
              <td className="p-2 border text-left">
                <pre className="overflow-x-auto whitespace-pre-wrap max-h-40">
                  {JSON.stringify(r.json, null, 2)}
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
