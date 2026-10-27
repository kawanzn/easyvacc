import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';

function mascararEmail(email: string) {
  const [usuario, dominio] = email.split('@');

  if (!usuario || !dominio) {
    return 'E-mail protegido';
  }

  const visiveis = usuario.slice(0, Math.min(3, usuario.length));
  const ocultos = '*'.repeat(Math.max(3, usuario.length - visiveis.length));

  return `${visiveis}${ocultos}@${dominio}`;
}

export default function ConfirmarEmail() {
  const location = useLocation();
  const [temaClaro, setTemaClaro] = useState(() => localStorage.getItem("easyvacc-tema") === "claro");
  useEffect(() => {
    const atualizar = () => setTemaClaro(localStorage.getItem("easyvacc-tema") === "claro");
    window.addEventListener("storage", atualizar);
    window.addEventListener("easyvaccTemaAtualizado", atualizar);
    return () => { window.removeEventListener("storage", atualizar); window.removeEventListener("easyvaccTemaAtualizado", atualizar); };
  }, []);

  const state = (location.state || {}) as {
    mensagem?: string;
    email?: string;
  };

  const email = state.email || '';

  return (
    <div className={`flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 ${temaClaro ? "easyvacc-light" : ""}`}>
      <style>{`
        .easyvacc-light { background: #edf3f9 !important; color: #10243e !important; }
        .easyvacc-light .text-white, .easyvacc-light .text-slate-100, .easyvacc-light .text-slate-200 { color: #10243e !important; }
        .easyvacc-light .text-slate-300 { color: #29435f !important; }
        .easyvacc-light .text-slate-400, .easyvacc-light .text-slate-500 { color: #526780 !important; }
        .easyvacc-light [class~="bg-slate-900"], .easyvacc-light [class~="bg-slate-900/60"], .easyvacc-light [class~="bg-slate-900/80"] { background-color: #fff !important; }
        .easyvacc-light [class~="bg-slate-950"], .easyvacc-light [class~="bg-slate-950/70"] { background-color: #edf3f9 !important; }
        .easyvacc-light [class~="bg-slate-800"], .easyvacc-light [class~="bg-slate-800/70"] { background-color: #e4edf7 !important; }
        .easyvacc-light [class~="border-slate-800"], .easyvacc-light [class~="border-slate-700"] { border-color: #c7d5e5 !important; }
        .easyvacc-light input, .easyvacc-light select, .easyvacc-light textarea { color: #10243e !important; background: #fff !important; border-color: #c7d5e5 !important; }
        .easyvacc-light .text-blue-400, .easyvacc-light .text-blue-300 { color: #175b96 !important; }
`}</style>
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

        {/* Ícone */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <Mail
              size={32}
              className="text-blue-400"
              aria-hidden="true"
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

            <p className="mt-1 break-all font-semibold text-blue-400">
              {mascararEmail(email)}
            </p>
          </div>
        )}

        {/* Instruções */}
        <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

          <div className="flex items-start gap-3">

            <CheckCircle2
              size={21}
              className="mt-0.5 shrink-0 text-blue-400"
              aria-hidden="true"
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
          className="mt-7 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#1769aa] font-bold text-slate-950 transition hover:bg-[#2582c4] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Ir para o login
        </Link>

      </div>
    </div>
  );
}