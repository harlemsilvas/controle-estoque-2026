import Header from "../components/Header";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
const groups = { products: "Produtos", brands: "Marcas", families: "Famílias", suppliers: "Fornecedores", reports: "Relatórios", stock: "Estoque", alerts: "Alertas", trash: "Lixeira", users: "Usuários", profiles: "Perfis", settings: "Configurações" };
const actions = { read: "Consultar", create: "Cadastrar", edit: "Editar", delete: "Excluir", move: "Movimentar", restore: "Restaurar" };
function label(permission) { const [group, action] = permission.split("."); return `${groups[group] || group}: ${actions[action] || action}`; }
export default function MeusAcessos() {
  const { user, can } = useAuth();
  return <><Header title="Minha sessão" /><main className="max-w-3xl mx-auto p-6">
    <h1 className="text-2xl font-bold mb-4">Meus acessos</h1>
    <p>Usuário: <strong>{user?.username}</strong></p><p>Email: {user?.email}</p><p className="mb-6">Perfil: <strong>{user?.profileName || user?.role}</strong></p>
    <ul className="space-y-2">{(user?.permissions || []).map(p => <li key={p}>{label(p)}</li>)}</ul>
    <div className="flex gap-4 mt-6">{can("users.read") && <Link className="text-blue-700" to="/admin/usuarios">Usuários e permissões</Link>}{can("profiles.read") && <Link className="text-blue-700" to="/admin/perfis">Perfis e permissões</Link>}{can("settings.read") && <Link className="text-blue-700" to="/admin/configuracoes">Configurações</Link>}</div>
  </main></>;
}
