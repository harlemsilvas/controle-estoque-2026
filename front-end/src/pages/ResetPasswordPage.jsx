import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../config/apiBaseUrl";
export default function ResetPasswordPage() {
  const [token] = useState(()=>new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [busy, setBusy] = useState(false), [done, setDone] = useState(false), [error, setError] = useState('');
  useEffect(()=>{ window.history.replaceState(null, '', window.location.pathname); }, []);
  async function submit(e) {
    e.preventDefault();setError('');if(password !== confirm) {setError('As senhas não conferem.');return;}setBusy(true);
    try {const response=await fetch(buildApiUrl('/reset-password'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,newPassword:password})});
      const data=await response.json();if(!response.ok)throw new Error(data.error || 'Não foi possível redefinir a senha.');
      localStorage.removeItem('token');localStorage.removeItem('user');window.dispatchEvent(new Event('auth:expired'));setPassword('');setConfirm('');setDone(true);
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <main className="max-w-md mx-auto p-8"><h1 className="text-xl font-bold mb-4">Nova senha</h1>
    {done ? <p role="status">Senha atualizada. Entre novamente.</p> : !token ? <p>Link ausente. Solicite outro e-mail de recuperação.</p> : <form onSubmit={submit}>
      <p>Use pelo menos 12 caracteres.</p>
      <label>Nova senha<input type="password" autoComplete="new-password" required minLength={12} value={password} disabled={busy} onChange={e=>setPassword(e.target.value)} className="block border p-2 w-full my-3" /></label>
      <label>Confirmar senha<input type="password" autoComplete="new-password" required minLength={12} value={confirm} disabled={busy} onChange={e=>setConfirm(e.target.value)} className="block border p-2 w-full my-3" /></label>
      <button disabled={busy} className="bg-blue-600 text-white rounded px-4 py-2">{busy ? 'Salvando…' : 'Salvar nova senha'}</button></form>}
    {error && <p role="alert" className="text-red-700 my-4">{error}</p>}
    <Link to="/forgot-password" className="text-blue-700 block mt-4">Solicitar outro link</Link><Link to="/login" className="text-blue-700 block mt-4">Voltar ao login</Link></main>;
}
