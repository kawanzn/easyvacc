import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { cpfValido, mascaraCpf, senhaAtendeRequisitos, soDigitos } from '../lib/brasil';

export default function RecuperarSenha() {
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');
  const [codigoDemo, setCodigoDemo] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const solicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!cpfValido(cpf)) {
      setErro('Informe um CPF válido.');
      return;
    }
    setCarregando(true);
    try {
      const data = await api<{ sucesso: boolean; mensagem?: string; codigoDemonstracao?: string }>(
        '/api/usuarios/recuperar-senha',
        { method: 'POST', body: JSON.stringify({ cpf: soDigitos(cpf), email }) }
      );
      setCodigoDemo(data.codigoDemonstracao || '');
      setOk(data.mensagem || 'Se os dados estiverem corretos, enviamos um código.');
      setEtapa(2);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Servidor indisponível.');
    } finally {
      setCarregando(false);
    }
  };

  const redefinir = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senha !== senhaConfirmacao) {
      setErro('As senhas precisam ser idênticas.');
      return;
    }
    if (!senhaAtendeRequisitos(senha)) {
      setErro('A senha deve ter no mínimo 8 caracteres, com letras e números.');
      return;
    }
    setCarregando(true);
    try {
      const data = await api<{ sucesso: boolean; mensagem?: string }>('/api/usuarios/redefinir-senha', {
        method: 'POST',
        body: JSON.stringify({
          cpf: soDigitos(cpf),
          codigo,
          senha,
          senha_confirmation: senhaConfirmacao,
        }),
      });
      setOk(data.mensagem || 'Senha atualizada.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível redefinir a senha.');
    } finally {
      setCarregando(false);
    }
  };

  const campo = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-base text-white';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <Link to="/login" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-200">
          <ArrowLeft size={16} /> Voltar ao login
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-white">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-6 text-slate-200">
          Informe o CPF e o e-mail da conta. Por segurança, a mensagem é a mesma se os dados existirem ou não.
        </p>

        {etapa === 1 ? (
          <form onSubmit={solicitar} className="mt-6 space-y-4">
            <input className={campo} value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} placeholder="CPF" required />
            <input className={campo} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required />
            {erro && <p className="text-sm font-semibold text-red-300">{erro}</p>}
            <button disabled={carregando} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00a884] font-bold text-slate-950 disabled:opacity-50">
              {carregando && <Loader2 className="animate-spin" size={18} />}
              Enviar código
            </button>
          </form>
        ) : (
          <form onSubmit={redefinir} className="mt-6 space-y-4">
            {ok && <p className="text-sm text-emerald-300">{ok}</p>}
            {codigoDemo && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                Ambiente de demonstração (e-mail em log): use o código <strong>{codigoDemo}</strong>.
              </p>
            )}
            <input className={campo} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Código de 6 dígitos" required />
            <input className={campo} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Nova senha" required />
            <input className={campo} type="password" value={senhaConfirmacao} onChange={(e) => setSenhaConfirmacao(e.target.value)} placeholder="Confirmar nova senha" required />
            {erro && <p className="text-sm font-semibold text-red-300">{erro}</p>}
            <button disabled={carregando} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00a884] font-bold text-slate-950 disabled:opacity-50">
              {carregando && <Loader2 className="animate-spin" size={18} />}
              Redefinir senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
