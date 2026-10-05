import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authenticatedFetch } from "../../services/authenticatedFetch";
import { buildApiUrl } from "../../config/apiBaseUrl";
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export default function TotalizacaoEstoque({ group, title }) {
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setRows([]);
    async function load() {
      try {
        const response = await authenticatedFetch(buildApiUrl(`/estoque/valor-total-por-${group}`));
        if (!response.ok) throw new Error("Não foi possível carregar a totalização.");
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Resposta inválida ao carregar a totalização.");
        if (active) setRows(data);
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    }
    load(); return () => { active = false; };
  }, [group]);
  return <section className="container mx-auto p-4">
    <Link to="/admin/totais" className="text-blue-700">← Todas as totalizações</Link>
    <h1 className="text-2xl font-bold my-4">Totalização por {title}</h1>
    {loading ? <p role="status">Carregando…</p> : error ? <p role="alert" className="text-red-700">{error}</p> : rows.length === 0 ? <p>Nenhum estoque encontrado para esta totalização.</p> : <>
      <table className="w-full text-left"><thead><tr><th className="p-2">{title}</th><th className="p-2 text-right">Valor do estoque</th></tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} className="border-b"><td className="p-2">{row[group] || "Sem descrição"}</td><td className="p-2 text-right">{currency.format(Number(row.valor_total ?? 0))}</td></tr>)}</tbody>
        <tfoot><tr className="font-bold"><td className="p-2">Total dos grupos exibidos</td><td className="p-2 text-right">{currency.format(rows.reduce((sum, row) => sum + Number(row.valor_total ?? 0), 0))}</td></tr></tfoot>
      </table>
    </>}
  </section>;
}
