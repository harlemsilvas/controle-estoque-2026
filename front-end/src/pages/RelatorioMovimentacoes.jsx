import React, { useState, useEffect } from "react";
import { getMovimentacoes } from "../services/api";

const LIMIT_OPTIONS = [5, 10, 15, 20];

const RelatorioMovimentacoes = () => {
  // Define datas padrão: últimos 7 dias
  function getDefaultDates() {
    const today = new Date();
    const prior = new Date();
    prior.setDate(today.getDate() - 6); // 7 dias incluindo hoje
    // Formato yyyy-mm-dd para input type="date"
    const toISO = (d) => d.toISOString().slice(0, 10);
    return {
      inicio: toISO(prior),
      fim: toISO(today),
    };
  }
  const { inicio, fim } = getDefaultDates();
  const [dataInicio, setDataInicio] = useState(inicio);
  const [dataFim, setDataFim] = useState(fim);
  const [limit, setLimit] = useState(10);
  const [orderBy, setOrderBy] = useState("data DESC");
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchMovimentacoes = async () => {
    setLoading(true);
    try {
      const params = {
        dataInicio,
        dataFim,
        limit,
        orderBy,
        page,
      };
      const data = await getMovimentacoes(params);
      setMovimentacoes(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setMovimentacoes([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimentacoes();
    // eslint-disable-next-line
  }, [dataInicio, dataFim, limit, orderBy, page]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Relatório de Movimentações de Estoque
      </h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Data Início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data Fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Exibir</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {LIMIT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ordenar por</label>
          <select
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="data DESC">Data (mais recente)</option>
            <option value="data ASC">Data (mais antiga)</option>
            <option value="produto ASC">Produto (A-Z)</option>
            <option value="produto DESC">Produto (Z-A)</option>
          </select>
        </div>
        <button
          onClick={() => setPage(1) || fetchMovimentacoes()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg mt-6 hover:bg-blue-700"
        >
          Filtrar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Produto</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Quantidade</th>
              <th className="px-4 py-2">Usuário</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  Carregando...
                </td>
              </tr>
            ) : movimentacoes.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  Nenhuma movimentação encontrada.
                </td>
              </tr>
            ) : (
              movimentacoes.map((mov, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-2">
                    {mov.DATA ? new Date(mov.DATA).toLocaleDateString() : ""}
                  </td>
                  <td className="px-4 py-2">{mov.PRODUTO}</td>
                  <td className="px-4 py-2">{mov.TIPO_LANCAMENTO}</td>
                  <td className="px-4 py-2">{mov.QUANTIDADE}</td>
                  <td className="px-4 py-2">{mov.USUARIO}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Paginação */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="font-medium">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelatorioMovimentacoes;
