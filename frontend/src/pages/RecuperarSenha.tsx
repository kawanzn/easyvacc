import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
} from 'lucide-react';
import { supabase } from '../services/supabase';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const solicitarRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();

    setErro('');
    setSucesso(false);

    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo) {
      setErro('Informe seu e-mail.');
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        emailLimpo,
        {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }
      );

      if (error) {
        throw error;
      }

      setSucesso(true);
    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o e-mail de recuperação.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar ao login
        </Link>

        <div className="mt-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Mail size={22} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white">
            Recuperar senha
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Informe o e-mail utilizado no cadastro. Enviaremos um link
            para você criar uma nova senha.
          </p>
        </div>

        {!sucesso ? (
          <form
            onSubmit={solicitarRecuperacao}
            className="mt-7 space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                E-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
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
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00a884] font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando && (
                <Loader2
                  className="animate-spin"
                  size={18}
                />
              )}

              {carregando
                ? 'Enviando...'
                : 'Enviar link de recuperação'}
            </button>
          </form>
        ) : (
          <div className="mt-7">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-emerald-400"
                  size={21}
                />

                <div>
                  <p className="font-semibold text-emerald-300">
                    Verifique seu e-mail
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Se existir uma conta associada a esse e-mail,
                    você receberá um link para redefinir sua senha.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSucesso(false);
                setErro('');
              }}
              className="mt-4 w-full text-center text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              Tentar outro e-mail
            </button>
          </div>
        )}
      </div>
    </div>
  );
}