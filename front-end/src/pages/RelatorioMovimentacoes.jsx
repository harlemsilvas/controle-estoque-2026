import React, { useState, useEffect } from "react";
import { getMovimentacoes, exportMovimentacoesCsv } from "../services/api";

function defaultFilters() {
  const today = new Date(), prior = new Date(); prior.setDate(today.getDate() - 6);
  const localDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { dataInicio: localDate(prior), dataFim: localDate(today), search: "", limit: 10, orderBy: "data DESC" };
}
export default function RelatorioMovimentacoes() {
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    getMovimentacoes({ ...applied, page }).then(data => { if (active) setResult(data); })
      .catch(e => { if (active) { setResult({ items: [], totalPages: 1, totalItems: 0 }); setError(e.response?.data?.error || "Não foi possível carregar o relatório."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applied, page]);
  function change(name, value) { setFilters(f => ({ ...f, [name]: value })); }
  function apply(e) {
    e.preventDefault();
    if (filters.dataInicio && filters.dataFim && filters.dataInicio > filters.dataFim) {
      setError("A data inicial deve ser anterior ou igual à data final."); return;
    }
    setPage(1); setApplied({ ...filters });
  }
  async function exportCsv() {
    if (exporting) return;
    setExporting(true); setError("");
    try {
      const blob = await exportMovimentacoesCsv(applied);
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = `movimentacoes-${applied.dataInicio || "inicio"}-${applied.dataFim || "fim"}.csv`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      let message = "Não foi possível exportar o relatório.";
      if (e.response?.data instanceof Blob) {
        try { message = JSON.parse(await e.response.data.text()).error || message; } catch { /* Mantém mensagem padrão. */ }
      }
      setError(message);
    } finally { setExporting(false); }
  }
  return <div className="container mx-auto p-6">
    <h1 className="text-2xl font-bold mb-4">Relatório de Movimentações de Estoque</h1>
    <form onSubmit={apply} className="flex flex-wrap gap-4 mb-6">
      <label>Data início<input type="date" value={filters.dataInicio} disabled={exporting} onChange={e => change("dataInicio", e.target.value)} className="block border rounded px-3 py-2" /></label>
      <label>Data fim<input type="date" value={filters.dataFim} disabled={exporting} onChange={e => change("dataFim", e.target.value)} className="block border rounded px-3 py-2" /></label>
      <label>Produto<input type="search" placeholder="Descrição ou código" maxLength={120} value={filters.search} disabled={exporting} onChange={e => change("search", e.target.value)} className="block border rounded px-3 py-2" /></label>
      <label>Exibir<select value={filters.limit} disabled={exporting} onChange={e => change("limit", Number(e.target.value))} className="block border rounded px-3 py-2">{[5,10,15,20,50].map(n => <option key={n}>{n}</option>)}</select></label>
      <label>Ordenar por<select value={filters.orderBy} disabled={exporting} onChange={e => change("orderBy", e.target.value)} className="block border rounded px-3 py-2">
        <option value="data DESC">Data (mais recente)</option><option value="data ASC">Data (mais antiga)</option><option value="produto ASC">Produto (A-Z)</option><option value="produto DESC">Produto (Z-A)</option>
      </select></label>
      <button disabled={exporting} className="bg-blue-600 text-white px-4 py-2 rounded mt-6">Filtrar</button>
      <button type="button" onClick={exportCsv} disabled={loading || exporting || !result.totalItems} className="bg-green-700 text-white px-4 py-2 rounded mt-6 disabled:opacity-50">{exporting ? "Exportando…" : "Exportar CSV"}</button>
    </form>
    <p className="mb-4">{result.totalItems} movimentações · O CSV inclui todas as páginas dos filtros aplicados. Clique em Filtrar após alterar os campos.</p>
    {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
    <div className="overflow-x-auto"><table className="min-w-full bg-white rounded shadow">
      <thead><tr className="bg-gray-100">{["Data","Produto","Tipo","Quantidade","Usuário"].map(h => <th key={h} className="px-4 py-2">{h}</th>)}</tr></thead>
      <tbody>{loading ? <tr><td colSpan={5} className="text-center py-6">Carregando…</td></tr> : !result.items.length ? <tr><td colSpan={5} className="text-center py-6">Nenhuma movimentação encontrada.</td></tr> : result.items.map((m,i) => <tr key={i} className="border-b">
        <td className="px-4 py-2">{m.DATA ? new Date(m.DATA).toLocaleDateString("pt-BR") : ""}</td><td className="px-4 py-2">{m.PRODUTO}</td><td className="px-4 py-2">{m.TIPO_LANCAMENTO}</td><td className="px-4 py-2">{m.QUANTIDADE}</td><td className="px-4 py-2">{m.USUARIO}</td>
      </tr>)}</tbody>
    </table></div>
    <div className="flex justify-center gap-4 mt-4"><button disabled={loading || exporting || page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Página {page} de {Math.max(1, result.totalPages)}</span><button disabled={loading || exporting || page >= result.totalPages} onClick={() => setPage(p => p + 1)}>Próxima</button></div>
  </div>;
}
