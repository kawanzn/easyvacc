import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { senhaAtendeRequisitos } from '../lib/brasil';

export default function RedefinirSenha() {
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [acessoValido, setAcessoValido] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let montado = true;

    const verificarSessao = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (montado && session) {
        setAcessoValido(true);
      }

      if (montado) {
        setVerificando(false);
      }
    };

    void verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && session)
      ) {
        setAcessoValido(true);
        setVerificando(false);
      }
    });

    return () => {
      montado = false;
      subscription.unsubscribe();
    };
  }, []);

  const redefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();

    setErro('');

    if (!senhaAtendeRequisitos(senha)) {
      setErro(
        'A senha deve ter no mínimo 8 caracteres, com letras e números.'
      );
      return;
    }

    if (senha !== confirmacao) {
      setErro('As senhas precisam ser idênticas.');
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) {
        throw error;
      }

      setSucesso(true);

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar sua senha.'
      );
    } finally {
      setCarregando(false);
    }
  };

  if (verificando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <Loader2
            className="mx-auto animate-spin text-emerald-400"
            size={28}
          />

          <p className="mt-3 text-sm text-slate-400">
            Validando link...
          </p>
        </div>
      </div>
    );
  }

  if (!acessoValido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
          <KeyRound
            className="mx-auto text-slate-500"
            size={32}
          />

          <h1 className="mt-4 text-xl font-bold text-white">
            Link inválido ou expirado
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Solicite um novo link para redefinir sua senha.
          </p>

          <Link
            to="/recuperar-senha"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#00a884] px-5 font-bold text-slate-950"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <KeyRound size={22} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-white">
          Criar nova senha
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Digite sua nova senha para acessar o EasyVacc.
        </p>

        {sucesso ? (
          <div className="mt-7 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="flex gap-3">
              <CheckCircle2
                className="shrink-0 text-emerald-400"
                size={21}
              />

              <div>
                <p className="font-semibold text-emerald-300">
                  Senha alterada
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  Sua senha foi atualizada. Você será direcionado
                  para o login.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={redefinirSenha}
            className="mt-7 space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Nova senha
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                placeholder="Nova senha"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Confirmar nova senha
              </label>

              <input
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-white outline-none focus:border-emerald-500"
              />
            </div>

            {erro && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-300">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00a884] font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {carregando && (
                <Loader2
                  className="animate-spin"
                  size={18}
                />
              )}

              {carregando
                ? 'Alterando...'
                : 'Redefinir senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}