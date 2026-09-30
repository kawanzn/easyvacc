import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import { supabase } from '../services/supabase';

export default function LoginAdministrador() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] =
    useState(false);

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (loginError || !data.user) {
        setErro(
          'E-mail ou senha inválidos.'
        );
        return;
      }

      const {
        data: ehAdmin,
        error: adminError,
      } = await supabase.rpc(
        'eh_administrador'
      );

      if (adminError || ehAdmin !== true) {
        await supabase.auth.signOut();

        setErro(
          'Esta conta não possui acesso administrativo.'
        );
        return;
      }

      navigate('/admin', {
        replace: true,
      });
    } catch (error) {
      console.error(
        'Erro no login administrativo:',
        error
      );

      setErro(
        'Não foi possível realizar o login. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
            <ShieldCheck size={32} />
          </div>

          <h1 className="text-2xl font-bold text-white">
            Administração EasyVacc
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Acesso exclusivo para administradores
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              E-mail
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white outline-none transition focus:border-teal-500"
                placeholder="E-mail administrativo"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-senha"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Senha
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="admin-senha"
                type="password"
                value={senha}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white outline-none transition focus:border-teal-500"
                placeholder="Sua senha"
              />
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Entrando...
              </>
            ) : (
              'Entrar como administrador'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}