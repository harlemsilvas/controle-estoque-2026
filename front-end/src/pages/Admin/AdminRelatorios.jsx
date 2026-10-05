import { Link } from "react-router-dom";

const reports = [
  { path: "movimentacoes", title: "Movimentações de estoque", description: "Consultar movimentações por período e produto, com exportação CSV." },
  { path: "fornecedores", title: "Por fornecedor", description: "Consultar as totalizações de estoque por fornecedor." },
  { path: "marcas", title: "Por marca", description: "Consultar as totalizações de estoque por marca." },
  { path: "familias", title: "Por família", description: "Consultar as totalizações de estoque por família." },
];
export default function AdminRelatorios() {
  return <section>
    <h1 className="text-2xl font-bold mb-6">Relatórios</h1>
    <div className="grid gap-4 md:grid-cols-2">{reports.map(report =>
      <Link key={report.path} to={`/admin/relatorios/${report.path}`} className="block border rounded-lg p-5 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500">
        <h2 className="text-lg font-semibold text-blue-700">{report.title}</h2>
        <p className="mt-2 text-gray-600">{report.description}</p>
      </Link>
    )}</div>
  </section>;
}
