import { useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../config/apiBaseUrl";
export default function RecoverPage() {
  const [email, setEmail] = useState(""), [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();setBusy(true);setError("");setMessage("");
    try { const response = await fetch(buildApiUrl('/recuperar-senha'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Não foi possível solicitar recuperação.'); setMessage(data.message);
    } catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="max-w-md mx-auto p-8"><h1 className="text-xl font-bold mb-4">Recuperar senha</h1>
    <form onSubmit={submit}><label>E-mail cadastrado<input type="email" required maxLength={100} value={email} disabled={busy} onChange={e=>setEmail(e.target.value)} className="block border p-2 w-full my-3" /></label>
      <button disabled={busy} className="bg-blue-600 text-white rounded px-4 py-2">{busy ? 'Enviando…' : 'Enviar instruções'}</button></form>
    {message && <p role="status" className="my-4">{message}</p>}{error && <p role="alert" className="text-red-700 my-4">{error}</p>}
    <Link to="/login" className="text-blue-700 block mt-4">Voltar ao login</Link></main>;
}
