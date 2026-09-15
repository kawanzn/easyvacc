import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function ConfirmarEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as {
    mensagem?: string;
    email?: string;
    codigoDemonstracao?: string;
  };
  const [token, setToken] = useState(state.codigoDemonstracao || '');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(state.mensagem || 'Conta criada. Confirme o e-mail para concluir.');
  const [carregando, setCarregando] = useState(false);

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const data = await api<{ sucesso: boolean; mensagem?: string }>('/api/usuarios/confirmar-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      setOk(data.mensagem || 'E-mail confirmado.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível confirmar o e-mail.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-bold text-white">Cadastro realizado</h1>
        <p className="mt-3 text-base leading-7 text-slate-200">{ok}</p>
        {state.email && <p className="mt-2 text-sm text-slate-300">E-mail informado: {state.email}</p>}
        {state.codigoDemonstracao && (
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            Ambiente de demonstração: o código de confirmação é <strong className="break-all">{state.codigoDemonstracao}</strong>.
          </p>
        )}
        <form onSubmit={confirmar} className="mt-6 space-y-4">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white"
            placeholder="Cole o código recebido"
            required
          />
          {erro && <p className="text-sm font-semibold text-red-300">{erro}</p>}
          <button disabled={carregando} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00a884] font-bold text-slate-950 disabled:opacity-50">
            {carregando && <Loader2 className="animate-spin" size={18} />}
            Confirmar e-mail
          </button>
        </form>
        <Link to="/login" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#00a884]">
          Ir para o login
        </Link>
      </div>
    </div>
  );
}
