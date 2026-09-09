import { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { API_URL } from '../lib/api';

/*
  ============================================================
  TIPOS
  ============================================================
*/

interface Notificacao {
  id: number | string;
  titulo: string;
  mensagem: string;
  lida: boolean;
}

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState<boolean>(() =>
    Boolean(localStorage.getItem('usuarioId'))
  );

  useEffect(() => {
    const usuarioId = localStorage.getItem('usuarioId');

    if (usuarioId) {
      fetch(`${API_URL}/api/notificacoes/${usuarioId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.sucesso) {
            setNotificacoes(data.dados);
          }
          setCarregando(false);
        })
        .catch((erro) => {
          console.error('Erro ao carregar notificações:', erro);
          setCarregando(false);
        });
    } else {
      setCarregando(false);
    }
  }, []);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100 antialiased pb-16">
      
      {/* Background Decorativo HealthTech */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/15 via-[#00a884]/20 to-cyan-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* CABEÇALHO DA PÁGINA */}
        <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-[#00a884]">
                <Sparkles size={13} />
                <span>Central de Avisos</span>
                <ChevronRight size={12} className="opacity-50" />
                <span>EasyVacc</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Notificações e Alertas
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Avisos e lembretes importantes sincronizados com a sua caderneta.
              </p>
            </div>

            {/* BADGE DE NÃO LIDAS */}
            {!carregando && notificacoes.length > 0 && (
              <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 md:self-auto">
                <div className={`h-2.5 w-2.5 rounded-full ${naoLidas > 0 ? 'bg-[#00a884] animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-xs font-semibold text-slate-300">
                  {naoLidas > 0 ? `${naoLidas} não lida(s)` : 'Todas lidas'}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* ESTADO DE CARREGAMENTO */}
        {carregando ? (
          <div className="flex min-h-[35vh] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#00a884]" />
              <p className="text-sm font-medium text-slate-400">
                Carregando notificações...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notificacoes.length > 0 ? (
              notificacoes.map((notif) => (
                <div
                  key={notif.id}
                  className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-200 ${
                    notif.lida
                      ? 'border-slate-800/80 bg-slate-950/40 text-slate-400 opacity-80 hover:opacity-100'
                      : 'border-emerald-500/30 bg-slate-900/90 text-white shadow-xl shadow-[#00a884]/5 backdrop-blur-xl'
                  }`}
                >
                  {/* BARRA ACCENT PARA NÃO LIDAS */}
                  {!notif.lida && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00a884]" />
                  )}

                  <div className="flex items-start gap-4">
                    {/* ÍCONE DA NOTIFICAÇÃO */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                        notif.lida
                          ? 'bg-slate-800/60 text-slate-500'
                          : 'bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/30 shadow-lg shadow-[#00a884]/20'
                      }`}
                    >
                      {notif.lida ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Bell size={18} />
                      )}
                    </div>

                    {/* CONTEÚDO */}
                    <div className="flex-1 pr-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`text-base font-bold ${notif.lida ? 'text-slate-300' : 'text-white'}`}>
                          {notif.titulo}
                        </h3>
                        {!notif.lida && (
                          <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-[#00a884] uppercase tracking-wider">
                            Nova
                          </span>
                        )}
                      </div>

                      <p className="text-sm leading-relaxed text-slate-400">
                        {notif.mensagem}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* ESTADO VAZIO */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center shadow-2xl backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/20">
                  <Inbox size={24} />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">
                  Nenhuma notificação no momento
                </h3>
                <p className="mt-1 max-w-sm text-sm text-slate-400">
                  Você está em dia com todos os alertas e lembretes da sua caderneta de vacinação.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}