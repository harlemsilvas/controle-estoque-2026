import { Link } from "react-router-dom";
export default function ResetPasswordPage() {
  return <main className="max-w-md mx-auto p-8"><h1 className="text-xl font-bold mb-4">Redefinição de senha</h1><p>Solicite a redefinição ao administrador do sistema.</p><Link to="/login" className="text-blue-700 block mt-4">Voltar ao login</Link></main>;
}
