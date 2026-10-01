import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Moon,
  Sun,
} from 'lucide-react';

import { supabase } from '../services/supabase';

export default function LoginAdministrador() {
  const navigate = useNavigate();

  const [temaClaro, setTemaClaro] = useState(
    () => localStorage.getItem('easyvacc-tema') === 'claro'
  );

  const alternarTema = () => {
    setTemaClaro((atual) => {
      const novoTemaClaro = !atual;
      localStorage.setItem(
        'easyvacc-tema',
        novoTemaClaro ? 'claro' : 'escuro'
      );
      return novoTemaClaro;
    });
  };


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
    <div className={`${temaClaro ? 'easyvacc-light ' : ''}flex min-h-screen items-center justify-center bg-slate-950 px-4`}>

      <style>{`
        .easyvacc-light {
          background: #f8fafc !important;
          color: #0f172a !important;
        }
        .easyvacc-light [class~="bg-slate-950"] {
          background-color: #f8fafc !important;
        }
        .easyvacc-light [class~="bg-slate-900"],
        .easyvacc-light [class~="bg-slate-900/60"],
        .easyvacc-light [class~="bg-slate-900/80"] {
          background-color: #ffffff !important;
        }
        .easyvacc-light [class~="bg-slate-800"],
        .easyvacc-light [class~="bg-slate-800/80"] {
          background-color: #f1f5f9 !important;
        }
        .easyvacc-light [class~="text-white"],
        .easyvacc-light [class~="text-slate-100"],
        .easyvacc-light [class~="text-slate-200"] {
          color: #0f172a !important;
        }
        .easyvacc-light [class~="text-slate-300"] {
          color: #334155 !important;
        }
        .easyvacc-light [class~="text-slate-400"],
        .easyvacc-light [class~="text-slate-500"] {
          color: #475569 !important;
        }
        .easyvacc-light [class~="border-slate-800"],
        .easyvacc-light [class~="border-slate-700"],
        .easyvacc-light [class~="border-slate-700/80"] {
          border-color: #cbd5e1 !important;
        }
        .easyvacc-light input,
        .easyvacc-light select,
        .easyvacc-light textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        .easyvacc-light input::placeholder,
        .easyvacc-light textarea::placeholder {
          color: #64748b !important;
        }
        .easyvacc-light input:disabled,
        .easyvacc-light select:disabled,
        .easyvacc-light textarea:disabled {
          background-color: #f1f5f9 !important;
        }
      `}</style>

      <button
        type="button"
        onClick={alternarTema}
        aria-label={temaClaro ? 'Ativar tema escuro' : 'Ativar tema claro'}
        title={temaClaro ? 'Tema escuro' : 'Tema claro'}
        className="fixed right-4 top-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-lg transition hover:border-teal-500 hover:text-teal-400"
      >
        {temaClaro ? <Moon size={19} /> : <Sun size={19} />}
      </button>

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