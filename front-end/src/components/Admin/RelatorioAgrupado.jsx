import React, { useEffect, useState } from "react";
import { getProdutoAggregate } from "../../services/api";
import { reportTypes, aggregateRows, filterAggregateRows, aggregateCsv } from "../../services/aggregate-report";

export default function RelatorioAgrupado({ type }) {
  const config = reportTypes[type];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", minValue: "", order: "name" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    getProdutoAggregate().then(data => { if (active) setRows(aggregateRows(data, type)); })
      .catch(() => { if (active) { setRows([]); setError("Não foi possível carregar o relatório. Tente atualizar."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type, revision]);
  const visible = filterAggregateRows(rows, filters);
  const totals = visible.reduce((sum,row) => ({ quantity: sum.quantity + row.quantity, value: sum.value + row.value }), { quantity: 0, value: 0 });
  const money = value => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  function change(key,value) { setFilters(f => ({ ...f, [key]: value })); }
  function download() {
    const blob = new Blob([aggregateCsv(visible, type)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = `estoque-por-${type}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section>
    <h1 className="text-2xl font-bold mb-6">Relatório por {config.label.toLowerCase()}</h1>
    <div className="flex flex-wrap gap-4 mb-4">
      <label>Buscar {config.label.toLowerCase()}<input type="search" value={filters.search} onChange={e => change("search", e.target.value)} className="block border rounded p-2" /></label>
      <label>Valor mínimo de estoque (R$)<input type="number" step="0.01" value={filters.minValue} onChange={e => change("minValue", e.target.value)} className="block border rounded p-2" /></label>
      <label>Ordenar<select value={filters.order} onChange={e => change("order", e.target.value)} className="block border rounded p-2"><option value="name">Nome (A–Z)</option><option value="value">Maior valor de estoque</option><option value="quantity">Maior quantidade</option></select></label>
      <button disabled={loading} onClick={() => setRevision(v => v + 1)} className="border rounded px-4">Atualizar</button>
      <button onClick={() => setFilters({ search: "", minValue: "", order: "name" })} className="border rounded px-4">Limpar filtros</button>
      <button disabled={loading || !!error || !visible.length} onClick={download} className="bg-green-700 text-white rounded px-4 disabled:opacity-50">Exportar CSV</button>
    </div>
    <p className="mb-4">Busca e totais atualizados automaticamente. O CSV contém os grupos filtrados, na ordem exibida.</p>
    {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
    {loading ? <p>Carregando…</p> : <>
      <p className="mb-4">{visible.length} grupos encontrados</p>
      <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-3">{config.label}</th><th className="p-3">{config.quantity}</th><th className="p-3">Valor total do estoque</th></tr></thead>
        <tbody>{visible.map((row,i) => <tr key={`${row.name}-${i}`} className="border-b"><td className="p-3">{row.name}</td><td className="p-3">{row.quantity.toLocaleString("pt-BR")}</td><td className="p-3">{money(row.value)}</td></tr>)}</tbody>
        <tfoot><tr className="bg-gray-100 font-semibold"><td className="p-3">Total filtrado</td><td className="p-3">{totals.quantity.toLocaleString("pt-BR")}</td><td className="p-3">{money(totals.value)}</td></tr></tfoot>
      </table></div>
      {!visible.length && <p className="mt-4">Nenhum resultado para estes filtros.</p>}
    </>}
  </section>;
}
