import { Link } from "react-router-dom";
export default function AdminConfiguracoes() {
  return <section><h1 className="text-2xl font-bold mb-6">Configurações</h1>
    <Link to="/configuracoes/lancamento" className="block border rounded-lg p-5 hover:bg-blue-50">
      <h2 className="text-lg font-semibold text-blue-700">Lançamento de estoque</h2>
      <p className="mt-2 text-gray-600">Ajustar leitura automática, aviso sonoro e limpeza de mensagens.</p>
    </Link>
  </section>;
}
