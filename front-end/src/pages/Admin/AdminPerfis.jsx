import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
const actionNames = { read: "Consultar", create: "Cadastrar", edit: "Editar", delete: "Excluir", move: "Movimentar", restore: "Restaurar" };
export default function AdminPerfis() {
  const { can } = useAuth();
  const [profiles, setProfiles] = useState([]), [groups, setGroups] = useState([]);
  const [form, setForm] = useState(null), [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  async function load() {
    try { const { data } = await api.get("/perfis"); setProfiles(data.profiles); setGroups(data.groups); }
    catch (e) { setError(e.response?.data?.error || "Erro ao carregar perfis."); }
  }
  useEffect(() => { load(); }, []);
  function open(profile) {
    setCreating(!profile); setForm(profile ? { ...profile, permissions: [...profile.permissions] } : { code: "", name: "", description: "", permissions: [] });setError("");setMessage("");
  }
  function toggle(permission) {
    setForm(f => {
      const next = new Set(f.permissions), [group, action] = permission.split(".");
      if (next.has(permission)) {
        next.delete(permission);
        if (action === "read") for (const p of next) if (p.startsWith(group + ".")) next.delete(p);
      } else { next.add(permission); next.add(group + ".read"); }
      return { ...f, permissions: [...next] };
    });
  }
  async function save(e) {
    e.preventDefault();if(saving)return;setSaving(true);setError("");setMessage("");
    try { await (creating ? api.post("/perfis",form) : api.put(`/perfis/${form.code}`,form));setForm(null);setMessage("Perfil salvo. As permissões passam a valer na API imediatamente; recarregue a sessão para atualizar os menus.");await load(); }
    catch (e) { setError(e.response?.data?.error || "Não foi possível salvar o perfil."); }
    finally { setSaving(false); }
  }
  return <section>
    <div className="flex justify-between mb-6"><h1 className="text-2xl font-bold">Perfis e permissões</h1>{can("profiles.create") && <button disabled={saving} onClick={() => open(null)} className="bg-blue-600 text-white px-4 py-2 rounded">Novo perfil</button>}</div>
    <p className="mb-4">Marque os menus e ações permitidos. Consultar permite abrir a lista; cadastrar, editar e excluir são direitos separados.</p>
    {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}{message && <p role="status" className="text-green-700 mb-4">{message}</p>}
    {form ? <form onSubmit={save} className="border rounded p-4">
      <label className="block mb-3">Código<input required pattern="[a-z][a-z0-9_-]{0,19}" maxLength={20} disabled={!creating || saving} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="block border rounded p-2" /></label>
      <label className="block mb-3">Nome<input required maxLength={80} disabled={saving} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="block border rounded p-2" /></label>
      <label className="block mb-3">Descrição<input maxLength={300} disabled={saving} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="block border rounded p-2 w-full" /></label>
      <div className="grid gap-4 md:grid-cols-2">{groups.map(g => <fieldset key={g.code} className="border rounded p-3"><legend className="font-semibold">{g.label}</legend>{g.actions.map(a => <label key={a} className="inline-flex gap-2 mr-4 my-2"><input type="checkbox" checked={form.permissions.includes(`${g.code}.${a}`)} disabled={saving} onChange={() => toggle(`${g.code}.${a}`)} />{actionNames[a] || a}</label>)}</fieldset>)}</div>
      <div className="flex gap-4 mt-6"><button disabled={saving} className="bg-blue-600 text-white rounded px-4 py-2">{saving ? "Salvando…" : "Salvar perfil"}</button><button type="button" disabled={saving} onClick={() => setForm(null)}>Cancelar</button></div>
    </form> : <table className="w-full text-left"><thead><tr><th>Perfil</th><th>Descrição</th><th>Ações</th></tr></thead><tbody>{profiles.map(p => <tr key={p.code} className="border-b"><td className="py-3">{p.name} <span className="text-sm text-gray-500">({p.code})</span></td><td>{p.description}</td><td>{p.code === "admin" ? "Protegido · acesso completo" : can("profiles.edit") && <button onClick={() => open(p)} className="text-blue-700">Editar permissões</button>}</td></tr>)}</tbody></table>}
    <p className="mt-6">Para atribuir um perfil, abra Admin → Usuários e permissões. Harlem e Monica permanecem Administradores.</p>
  </section>;
}
