import { useEffect, useState } from "react";
import Header from "../components/Header";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
const resources = [{code:'produtos',label:'Produtos',permission:'products.read'},{code:'fornecedores',label:'Fornecedores',permission:'suppliers.read'},{code:'marcas',label:'Marcas',permission:'brands.read'},{code:'familias',label:'Famílias',permission:'families.read'}];
export default function RelatorioCadastros() {
  const { can } = useAuth(), available = resources.filter(r=>can(r.permission));
  const [resource,setResource]=useState(()=>available[0]?.code || ''), [search,setSearch]=useState(''), [applied,setApplied]=useState({search:''}), [page,setPage]=useState(1);
  const [result,setResult]=useState({data:[],columns:[],total:0}), [loading,setLoading]=useState(false), [exporting,setExporting]=useState(false), [error,setError]=useState('');
  const [filters,setFilters]=useState({fornecedor:'',marca:'',familia:''});
  useEffect(()=>{
    if(!resource)return;let active=true;setLoading(true);setError('');setResult({data:[],columns:[],total:0});
    api.get(`/relatorio/cadastros/${resource}`,{params:{...applied,page,limit:25}}).then(({data})=>{if(active)setResult(data);}).catch(e=>{if(active)setError(e.response?.data?.error || 'Erro ao consultar cadastros.');}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[resource,applied,page]);
  async function exportCsv() {
    setExporting(true);setError('');
    try {const response=await api.get(`/relatorio/cadastros/${resource}`,{params:{...applied,format:'csv'},responseType:'blob'});
      const url=URL.createObjectURL(response.data),link=document.createElement('a');link.href=url;link.download=`cadastro-${resource}.csv`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){let message='Erro ao exportar cadastros.';try{const data=JSON.parse(await e.response.data.text());message=data.error || message;}catch{}setError(message);}finally{setExporting(false);}
  }
  function changeResource(value) {setResource(value);setSearch('');setFilters({fornecedor:'',marca:'',familia:''});setApplied({search:''});setPage(1);}
  return <><Header /><main className="container mx-auto p-6"><h1 className="text-2xl font-bold mb-4">Relatórios de cadastros</h1>
    {!available.length ? <p>Seu perfil não permite consultar cadastros.</p> : <>
      <form onSubmit={e=>{e.preventDefault();setPage(1);setApplied({search,...(resource==='produtos'?filters:{})});}} className="flex flex-wrap gap-3 mb-4">
        <label>Cadastro<select value={resource} disabled={exporting} onChange={e=>changeResource(e.target.value)} className="block border p-2">{available.map(r=><option key={r.code} value={r.code}>{r.label}</option>)}</select></label>
        <label>Busca<input value={search} maxLength={120} onChange={e=>setSearch(e.target.value)} placeholder="Código, nome ou descrição" className="block border p-2" /></label>
        {resource==='produtos' && Object.entries({fornecedor:'Código do fornecedor',marca:'Código da marca',familia:'Código da família'}).map(([key,label])=><label key={key}>{label}<input type="number" min="1" step="1" value={filters[key]} onChange={e=>setFilters(f=>({...f,[key]:e.target.value}))} className="block border p-2 w-40" /></label>)}
        <button disabled={loading || exporting} className="bg-blue-600 text-white p-2 rounded self-end">Consultar</button>
        <button type="button" disabled={loading || exporting} onClick={exportCsv} className="border p-2 rounded self-end">{exporting?'Exportando…':'Exportar CSV'}</button>
      </form>
      <p className="text-sm mb-4">Exporta todos os resultados dos filtros aplicados, até 10.000 registros. Códigos de barras, códigos internos, CNPJ e telefone recebem apóstrofo para preservar o texto no Excel.</p>
      {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
      {loading ? <p role="status">Carregando…</p> : <><p className="mb-2">{result.total} registro(s)</p><div className="overflow-auto"><table className="w-full text-left"><thead><tr>{result.columns.map(c=><th key={c.key} className="p-2 border-b">{c.label}</th>)}</tr></thead><tbody>{result.data.map(row=><tr key={row.CODIGO}>{result.columns.map(c=><td key={c.key} className="p-2 border-b">{row[c.key] ?? ''}</td>)}</tr>)}</tbody></table></div>{!result.data.length && <p>Nenhum cadastro encontrado.</p>}
        <div className="flex gap-4 mt-4"><button disabled={page<=1 || exporting} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page} de {Math.max(1,Math.ceil(result.total/25))}</span><button disabled={page*25>=result.total || exporting} onClick={()=>setPage(p=>p+1)}>Próxima</button></div></>}
    </>}
  </main></>;
}
