import { useAuth } from "../hooks/useAuth";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProdutos, associarProdutoOrfao } from "../services/api";

export default function CatalogoFornecedor({ fornecedor, onClose }) {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [orfaos, setOrfaos] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [summary, setSummary] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    getProdutos({ page, limit: 20, search, fornecedor: orfaos ? undefined : fornecedor.CODIGO, orfaos })
      .then(data => { if (active) { setResult(data); setSelected(ids => ids.filter(id => data.data.some(p => p.CODIGO === id))); } })
      .catch(() => { if (active) setError("Não foi possível carregar os produtos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, orfaos, fornecedor.CODIGO, revision]);
  function resetSelection() { setSelected([]); setPending(null); setSummary(""); setError(""); }
  function toggle(codigo) {
    setSelected(ids => ids.includes(codigo) ? ids.filter(id => id !== codigo) : [...ids, codigo]);
  }
  async function associate() {
    if (saving || !pending?.length) return;
    const items = [...pending];
    setSaving(true); setError(""); setSummary("");
    const succeeded = [];
    const failed = [];
    try {
      for (const item of items) {
        try {
          await associarProdutoOrfao(item.CODIGO, fornecedor.CODIGO);
          succeeded.push(item.CODIGO);
        } catch (e) {
          failed.push({ codigo: item.CODIGO, error: e.response?.data?.error || "Falha na associação. Verifique a lista antes de tentar novamente." });
        }
      }
      setSelected(ids => ids.filter(id => !succeeded.includes(id)));
      setPending(null);
      setSummary(`${succeeded.length} produto(s) associado(s) a ${fornecedor.NOME}.`);
      if (failed.length) setError(`${failed.length} produto(s) não associado(s): ${failed.map(f => `${f.codigo}: ${f.error}`).join("; ")}`);
      setRevision(v => v + 1);
    } finally { setSaving(false); }
  }
  return <section className="max-w-5xl mx-auto bg-white rounded p-6">
    <button disabled={saving} onClick={onClose}>← Voltar aos fornecedores</button>
    <h1 className="text-2xl font-bold my-4">Produtos de {fornecedor.NOME}</h1>
    <div className="flex flex-wrap gap-4 mb-4">
      <button disabled={saving || !can("products.create")} onClick={() => navigate(`/produto/novo?fornecedor=${fornecedor.CODIGO}`)} className="bg-blue-600 text-white rounded px-4 py-2">Novo produto</button>
      <button onClick={() => { setOrfaos(v => !v); setPage(1); resetSelection(); }} disabled={saving} className="border rounded px-4 py-2">{orfaos ? "Ver catálogo" : "Associar produtos sem fornecedor"}</button>
    </div>
    {orfaos && <div className="flex flex-wrap gap-4 items-center my-4">
      <button disabled={saving || loading || !selected.length || !can("products.edit")} onClick={() => setPending(result.data.filter(p => selected.includes(p.CODIGO)))} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">
        Associar selecionados a {fornecedor.NOME} ({selected.length})
      </button>
      <button disabled={saving || !selected.length} onClick={resetSelection}>Limpar seleção</button>
      <span className="text-sm text-gray-600">Seleção limitada à página atual.</span>
    </div>}
    <p>{orfaos ? "Produtos sem fornecedor válido. Produtos já associados não serão substituídos." : "Produtos vinculados a este fornecedor."}</p>
    <input aria-label="Buscar produtos" placeholder="Buscar por código, descrição ou código de barras" className="border rounded w-full p-2 my-4" value={search} disabled={saving} onChange={e => { setSearch(e.target.value); setPage(1); resetSelection(); }} />
    {summary && <p role="status" className="text-green-700">{summary}</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {pending && <div className="border p-4 my-4" role="dialog" aria-label="Confirmar associação">
      <p>Associar {pending.length} produto(s) a <strong>{fornecedor.NOME}</strong>?</p>
      <ul className="max-h-48 overflow-auto my-2">{pending.map(p => <li key={p.CODIGO}>{p.CODIGO} — {p.DESCRICAO}</li>)}</ul>
      <button disabled={saving} onClick={associate} className="mr-4 text-blue-700">{saving ? "Salvando…" : "Confirmar associação"}</button>
      <button disabled={saving} onClick={() => setPending(null)}>Cancelar</button>
    </div>}
    {loading ? <p>Carregando…</p> : <>
      <table className="w-full text-left"><thead><tr>{orfaos && <th><input type="checkbox" aria-label="Selecionar todos os produtos desta página" disabled={saving || !result.data.length} checked={result.data.length > 0 && result.data.every(p => selected.includes(p.CODIGO))} onChange={e => setSelected(e.target.checked ? result.data.map(p => p.CODIGO) : [])} /></th>}<th>Código</th><th>Descrição</th><th>Ação</th></tr></thead>
        <tbody>{result.data.map(p => <tr key={p.CODIGO} className="border-b">{orfaos && <td><input type="checkbox" aria-label={`Selecionar produto ${p.CODIGO} — ${p.DESCRICAO}`} checked={selected.includes(p.CODIGO)} disabled={saving} onChange={() => toggle(p.CODIGO)} /></td>}<td>{p.CODIGO}</td><td>{p.DESCRICAO}</td><td>{orfaos ? <button disabled={saving || !can("products.edit")} className="text-blue-700 p-2" onClick={() => setPending([p])}>Associar</button> : <button disabled={!can("products.edit")} className="text-blue-700 p-2" onClick={() => navigate(`/produto/editar/${p.CODIGO}`)}>Editar</button>}</td></tr>)}</tbody></table>
      {!result.data.length && <p className="my-4">Nenhum produto encontrado.</p>}
      <div className="flex gap-4 mt-4"><button disabled={saving || page <= 1} onClick={() => { setPage(v => v - 1); resetSelection(); }}>Anterior</button><span>Página {page} de {Math.max(1, result.totalPages)} · {result.total} produtos</span><button disabled={saving || page >= result.totalPages} onClick={() => { setPage(v => v + 1); resetSelection(); }}>Próxima</button></div>
    </>}
  </section>;
}
