import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';

export default function ConfirmarEmail() {
  const location = useLocation();

  const state = (location.state || {}) as {
    mensagem?: string;
    email?: string;
  };

  const email = state.email || '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

        {/* Ícone */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <Mail
              size={32}
              className="text-emerald-400"
            />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-center text-2xl font-bold text-white">
          Verifique seu e-mail
        </h1>

        {/* Mensagem */}
        <p className="mt-4 text-center text-base leading-7 text-slate-300">
          Seu cadastro foi realizado com sucesso.
          Enviamos um link de confirmação para o seu e-mail.
        </p>

        {/* E-mail */}
        {email && (
          <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              E-mail informado
            </p>

            <p className="mt-1 break-all font-semibold text-emerald-400">
              {email}
            </p>
          </div>
        )}

        {/* Instruções */}
        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">

          <div className="flex items-start gap-3">

            <CheckCircle2
              size={21}
              className="mt-0.5 shrink-0 text-emerald-400"
            />

            <div>
              <p className="font-semibold text-white">
                Como confirmar sua conta
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Abra o e-mail enviado pelo EasyVacc e clique no
                link de confirmação.
              </p>
            </div>

          </div>

        </div>

        {/* Aviso */}
        <p className="mt-5 text-center text-sm leading-6 text-slate-400">
          Não recebeu o e-mail? Verifique também sua caixa de spam
          ou lixo eletrônico.
        </p>

        {/* Login */}
        <Link
          to="/login"
          className="mt-7 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#00a884] font-bold text-slate-950 transition hover:bg-[#00bd96]"
        >
          Ir para o login
        </Link>

      </div>
    </div>
  );
}