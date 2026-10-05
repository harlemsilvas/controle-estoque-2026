import { Link, useNavigate } from "react-router-dom";
import { FaBox, FaChartBar, FaExchangeAlt, FaUserShield, FaChevronDown, FaBell } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { getLixeiraCount } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import AlertBadge from "./AlertBadge";

function MenuGroup({ label, icon: Icon, items, closeMenus }) {
  if (!items.length) return null;
  return <details className="relative">
    <summary className="list-none cursor-pointer flex items-center gap-2 rounded px-3 py-2 hover:bg-gray-100 focus-visible:outline-blue-600">
      <Icon aria-hidden="true" /> {label} <FaChevronDown aria-hidden="true" className="text-xs" />
    </summary>
    <div className="absolute left-0 top-full w-64 z-50 bg-white border rounded-lg shadow-lg p-2">
      {items.map(item => item.children ? <details key={item.label}>
        <summary className="cursor-pointer rounded p-2 hover:bg-gray-100">{item.label}</summary>
        <div className="pl-3">{item.children.map(child => <Link key={child.to} to={child.to} onClick={closeMenus} className="block rounded p-2 hover:bg-blue-50">{child.label}</Link>)}</div>
      </details> : <Link key={item.to} to={item.to} onClick={closeMenus} className="flex justify-between rounded p-2 hover:bg-blue-50">
        <span>{item.label}</span>{item.count > 0 && <span className="bg-red-600 text-white rounded-full px-2 text-xs" aria-label={`${item.count} itens na lixeira`}>{item.count}</span>}
      </Link>)}
    </div>
  </details>;
}
export default function Header({ title, btnText, btnPath }) {
  const [deletedCount, setDeletedCount] = useState(0);
  const navigate = useNavigate();
  const { user, logout, can } = useAuth();
  const isAdmin = user?.role === "admin";
  const showAdmin = isAdmin || user?.permissions?.some(p => /^(users|profiles|settings)\./.test(p));
  const navRef = useRef(null);
  function closeMenus() { navRef.current?.querySelectorAll("details[open]").forEach(d => d.removeAttribute("open")); }
  useEffect(() => {
    let active = true;
    if (can("trash.read")) getLixeiraCount().then(data => { if (active) setDeletedCount(Number(data?.count ?? 0)); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    function outside(e) { if (!navRef.current?.contains(e.target)) closeMenus(); }
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, []);
  const registrations = [{ permission: "products.read", label: "Produtos", to: "/produtos" }, { permission: "brands.read", label: "Marcas", to: "/marcas" }, { permission: "families.read", label: "Famílias", to: "/familias" }, { permission: "suppliers.read", label: "Fornecedores", to: "/fornecedores" }];
  const reports = [{ label: "Movimentações de estoque", to: "/relatorios" }, ...(can("reports.read") ? [
    { label: "Por fornecedor", to: "/relatorios/fornecedores" }, { label: "Por marca", to: "/relatorios/marcas" },
    { label: "Por família", to: "/relatorios/familias" }, ...(showAdmin ? [{ label: "Todos os relatórios", to: "/admin/relatorios" }] : [])
  ] : [])];
  const administration = [{ label: "Painel administrativo", to: "/admin" }, { permission: "users.read", label: "Usuários e permissões", to: "/admin/usuarios" }, { permission: "profiles.read", label: "Perfis e permissões", to: "/admin/perfis" },
    { label: "Etiquetas", to: "/admin/etiquetas" }, { label: "Totalização do estoque", children: [
      { label: "Todas as totalizações", to: "/admin/totais" },
      { label: "Visão geral", to: "/admin/totalizacao" },
      { label: "Por marca", to: "/admin/totalizacao/marca" },
      { label: "Por fornecedor", to: "/admin/totalizacao/fornecedor" },
      { label: "Por família", to: "/admin/totalizacao/familia" }
    ] },
    { permission: "settings.read", label: "Configurações", children: [{ label: "Geral", to: "/admin/configuracoes" }, { label: "Lançamento de estoque", to: "/configuracoes/lancamento" }] }];
  return <header className="bg-white shadow-lg">
    <nav ref={navRef} aria-label="Menu principal" className="container mx-auto px-4 py-4" onKeyDown={e => {
      if (e.key === "Escape") { const details = e.target.closest("details"); closeMenus(); details?.querySelector("summary")?.focus(); }
    }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/" onClick={closeMenus} className="text-2xl font-bold text-blue-600 flex items-center gap-2"><FaBox /> EstoqueApp</Link>
        <div className="flex flex-wrap items-center gap-2">
          <MenuGroup label="Cadastros" icon={FaBox} items={registrations.filter(i => can(i.permission))} closeMenus={closeMenus} />
          {can("reports.read") && <MenuGroup label="Relatórios" icon={FaChartBar} items={reports} closeMenus={closeMenus} />}
          {can("stock.move") && <Link to="/estoque/lancamento" onClick={closeMenus} className="flex items-center gap-2 rounded px-3 py-2 hover:bg-gray-100"><FaExchangeAlt /> Movimentação de estoque</Link>}
          <MenuGroup label="Consultas" icon={FaBell} items={[{ permission: "alerts.read", label: "Alertas", to: "/alertas/historico" }, { permission: "trash.read", label: "Lixeira", to: "/produtos/lixeira", count: deletedCount }].filter(i => can(i.permission))} closeMenus={closeMenus} />
          {showAdmin && <MenuGroup label="Admin" icon={FaUserShield} items={administration.filter(i => i.permission ? can(i.permission) : isAdmin)} closeMenus={closeMenus} />}
        </div>
        <div className="flex items-center gap-4">
          <Link to="/conta/acessos" onClick={closeMenus} className="text-sm text-gray-700 hover:text-blue-700" title="Ver meus acessos">
            <strong>{user?.username || "Usuário"}</strong><span className="block text-xs">{user?.profileName || (isAdmin ? "Administrador" : user?.role)} · Meus acessos</span>
          </Link>
          {can("alerts.read") && <AlertBadge />}
          {btnText && <Link to={btnPath} className="bg-blue-600 text-white px-4 py-2 rounded">{btnText}</Link>}
          <button onClick={async () => { try { await logout(); } catch { /* Sessão local já limpa. */ } navigate("/login"); }} className="bg-red-600 text-white px-4 py-2 rounded">Sair</button>
        </div>
      </div>
      {title && <p className="mt-3 text-gray-600">{title}</p>}
    </nav>
  </header>;
}
