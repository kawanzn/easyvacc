import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Inbox,
  Loader2,
  Megaphone,
  Sparkles,
  Syringe,
  Trash2,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { lerPessoaAtiva } from '../lib/brasil';

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  referencia: string | null;
  lida: boolean;
  created_at: string;
}

interface Vacina {
  id: number;
  nome: string;
  proxima_dose: string | null;
}

interface Campanha {
  id: number;
  titulo: string;
}

interface NovaNotificacao {
  usuario_id: string;
  dependente_id: number | null;
  tipo: string;
  referencia: string;
  titulo: string;
  mensagem: string;
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-');

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(data: string) {
  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return 'Data não disponível';
  }

  return valor.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function obterIdCampanha(referencia: string | null) {
  if (!referencia?.startsWith('campanha-')) {
    return null;
  }

  const id = Number(referencia.replace('campanha-', ''));

  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function Notificacoes() {
  const navigate = useNavigate();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [excluindoLidas, setExcluindoLidas] = useState(false);
  const [abrindoId, setAbrindoId] = useState<number | null>(null);

  const carregarNotificacoes = useCallback(async () => {
    setCarregando(true);
    setErro('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setNotificacoes([]);
        setErro('Você precisa estar autenticado.');
        return;
      }

      const pessoaAtiva = lerPessoaAtiva();

      const dependenteId =
        pessoaAtiva?.tipo === 'dependente'
          ? Number(pessoaAtiva.id)
          : null;

      let queryVacinas = supabase
        .from('vacinas')
        .select('id, nome, proxima_dose')
        .eq('usuario_id', user.id)
        .in('status', ['ativo', 'corrigido'])
        .not('proxima_dose', 'is', null);

      if (dependenteId !== null) {
        queryVacinas = queryVacinas.eq(
          'dependente_id',
          dependenteId
        );
      } else {
        queryVacinas = queryVacinas.is(
          'dependente_id',
          null
        );
      }

      const {
        data: vacinasData,
        error: vacinasError,
      } = await queryVacinas;

      if (vacinasError) {
        throw vacinasError;
      }

      const vacinas = (vacinasData || []) as Vacina[];

      const {
        data: campanhasData,
        error: campanhasError,
      } = await supabase
        .from('campanhas')
        .select('id, titulo')
        .eq('ativa', true)
        .order('destaque', {
          ascending: false,
        });

      if (campanhasError) {
        console.error(
          'Erro ao carregar campanhas:',
          campanhasError
        );
      }

      const campanhas = (campanhasData || []) as Campanha[];

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const daqui30Dias = new Date(hoje);
      daqui30Dias.setDate(
        daqui30Dias.getDate() + 30
      );

      const novasNotificacoes: NovaNotificacao[] = [];

      vacinas.forEach((vacina) => {
        if (!vacina.proxima_dose) {
          return;
        }

        const dataDose = new Date(
          `${vacina.proxima_dose}T00:00:00`
        );

        if (dataDose < hoje) {
          novasNotificacoes.push({
            usuario_id: user.id,
            dependente_id: dependenteId,
            tipo: 'dose_atrasada',
            referencia:
              `vacina-${vacina.id}-${vacina.proxima_dose}`,
            titulo: 'Dose atrasada',
            mensagem:
              `A próxima dose de ${vacina.nome} estava prevista para ` +
              `${formatarData(vacina.proxima_dose)}.`,
          });

          return;
        }

        if (dataDose <= daqui30Dias) {
          novasNotificacoes.push({
            usuario_id: user.id,
            dependente_id: dependenteId,
            tipo: 'proxima_dose',
            referencia:
              `vacina-${vacina.id}-${vacina.proxima_dose}`,
            titulo: 'Próxima dose',
            mensagem:
              `A próxima dose de ${vacina.nome} está prevista para ` +
              `${formatarData(vacina.proxima_dose)}.`,
          });
        }
      });

      campanhas.forEach((campanha) => {
        novasNotificacoes.push({
          usuario_id: user.id,
          dependente_id: dependenteId,
          tipo: 'campanha',
          referencia: `campanha-${campanha.id}`,
          titulo: 'Campanha de vacinação',
          mensagem: campanha.titulo,
        });
      });

      let queryExistentes = supabase
        .from('notificacoes')
        .select('tipo, referencia')
        .eq('usuario_id', user.id);

      if (dependenteId !== null) {
        queryExistentes = queryExistentes.eq(
          'dependente_id',
          dependenteId
        );
      } else {
        queryExistentes = queryExistentes.is(
          'dependente_id',
          null
        );
      }

      const {
        data: existentesData,
        error: existentesError,
      } = await queryExistentes;

      if (existentesError) {
        throw existentesError;
      }

      const chavesExistentes = new Set(
        (existentesData || []).map(
          (item) =>
            `${item.tipo}|${item.referencia}`
        )
      );

      const paraInserir = novasNotificacoes.filter(
        (item) =>
          !chavesExistentes.has(
            `${item.tipo}|${item.referencia}`
          )
      );

      if (paraInserir.length > 0) {
        const { error: insertError } = await supabase
          .from('notificacoes')
          .insert(paraInserir);

        if (
          insertError &&
          insertError.code !== '23505'
        ) {
          throw insertError;
        }
      }

      let queryNotificacoes = supabase
        .from('notificacoes')
        .select(
          'id, titulo, mensagem, tipo, referencia, lida, created_at'
        )
        .eq('usuario_id', user.id)
        .eq('excluida', false);

      if (dependenteId !== null) {
        queryNotificacoes = queryNotificacoes.eq(
          'dependente_id',
          dependenteId
        );
      } else {
        queryNotificacoes = queryNotificacoes.is(
          'dependente_id',
          null
        );
      }

      const {
        data: notificacoesData,
        error: notificacoesError,
      } = await queryNotificacoes.order(
        'created_at',
        {
          ascending: false,
        }
      );

      if (notificacoesError) {
        throw notificacoesError;
      }

      setNotificacoes(
        (notificacoesData || []) as Notificacao[]
      );
    } catch (error) {
      console.error(
        'Erro ao carregar notificações:',
        error
      );

      setErro(
        'Não foi possível carregar as notificações. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarNotificacoes();

    const handlePessoaAtivaAtualizada = () => {
      void carregarNotificacoes();
    };

    window.addEventListener(
      'pessoaAtivaAtualizada',
      handlePessoaAtivaAtualizada
    );

    return () => {
      window.removeEventListener(
        'pessoaAtivaAtualizada',
        handlePessoaAtivaAtualizada
      );
    };
  }, [carregarNotificacoes]);

  const marcarComoLida = async (
    notificacao: Notificacao
  ) => {
    if (notificacao.lida) {
      return true;
    }

    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({
          lida: true,
          lida_em: new Date().toISOString(),
        })
        .eq('id', notificacao.id);

      if (error) {
        throw error;
      }

      setNotificacoes((anteriores) =>
        anteriores.map((item) =>
          item.id === notificacao.id
            ? {
                ...item,
                lida: true,
              }
            : item
        )
      );

      window.dispatchEvent(new Event('notificacaoAtualizada'));

      return true;
    } catch (error) {
      console.error(
        'Erro ao marcar notificação como lida:',
        error
      );

      setErro(
        'Não foi possível atualizar a notificação.'
      );

      return false;
    }
  };

  const abrirNotificacao = async (
    notificacao: Notificacao
  ) => {
    if (abrindoId !== null) {
      return;
    }

    setAbrindoId(notificacao.id);
    setErro('');

    try {
      await marcarComoLida(notificacao);

      if (notificacao.tipo === 'campanha') {
        const campanhaId =
          obterIdCampanha(notificacao.referencia);

        if (campanhaId !== null) {
          navigate(
            `/campanhas?campanha=${campanhaId}`
          );
          return;
        }

        navigate('/campanhas');
        return;
      }

      if (
        notificacao.tipo === 'dose_atrasada' ||
        notificacao.tipo === 'proxima_dose' ||
        notificacao.tipo === 'alerta_vacinal'
      ) {
        navigate('/historico');
      }
    } finally {
      setAbrindoId(null);
    }
  };

  const marcarTodasComoLidas = async () => {
    const ids = notificacoes
      .filter((item) => !item.lida)
      .map((item) => item.id);

    if (ids.length === 0) {
      return;
    }

    setMarcandoTodas(true);
    setErro('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setErro('Você precisa estar autenticado.');
        return;
      }

      const { error } = await supabase
        .from('notificacoes')
        .update({
          lida: true,
          lida_em: new Date().toISOString(),
        })
        .eq('usuario_id', user.id)
        .in('id', ids);

      if (error) {
        throw error;
      }

      setNotificacoes((anteriores) =>
        anteriores.map((item) => ({
          ...item,
          lida: true,
        }))
      );

      window.dispatchEvent(new Event('notificacaoAtualizada'));
    } catch (error) {
      console.error(
        'Erro ao marcar todas como lidas:',
        error
      );

      setErro(
        'Não foi possível marcar todas as notificações como lidas.'
      );
    } finally {
      setMarcandoTodas(false);
    }
  };

  const excluirNotificacoesLidas = async () => {
    const ids = notificacoes.filter((item) => item.lida).map((item) => item.id);
    if (!ids.length || excluindoLidas) return;
    if (!window.confirm(`Excluir ${ids.length} notificação(ões) lida(s)? Essa ação não pode ser desfeita.`)) return;

    setExcluindoLidas(true);
    setErro('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Sessão expirada. Entre novamente.');
      const pessoaAtiva = lerPessoaAtiva();
      const dependenteId = pessoaAtiva?.tipo === 'dependente' ? Number(pessoaAtiva.id) : null;
      let query = supabase.from('notificacoes')
        .update({ excluida: true })
        .eq('usuario_id', user.id)
        .eq('lida', true)
        .in('id', ids);
      if (dependenteId !== null) query = query.eq('dependente_id', dependenteId);
      else query = query.is('dependente_id', null);
      const { error } = await query;
      if (error) throw error;
      setNotificacoes((anteriores) => anteriores.filter((item) => !ids.includes(item.id)));
      window.dispatchEvent(new Event('notificacaoAtualizada'));
    } catch (error) {
      console.error('Erro ao excluir notificações lidas:', error);
      setErro('Não foi possível excluir as notificações lidas. Verifique se a atualização do banco foi aplicada.');
    } finally {
      setExcluindoLidas(false);
    }
  };

  const iconeNotificacao = (
    notificacao: Notificacao
  ) => {
    if (notificacao.lida) {
      return <CheckCircle2 size={18} aria-hidden="true" />;
    }

    if (notificacao.tipo === 'dose_atrasada') {
      return <Syringe size={18} aria-hidden="true" />;
    }

    if (notificacao.tipo === 'proxima_dose') {
      return <CalendarClock size={18} aria-hidden="true" />;
    }

    if (notificacao.tipo === 'campanha') {
      return <Megaphone size={18} aria-hidden="true" />;
    }

    return <Bell size={18} aria-hidden="true" />;
  };

  const fonteNotificacao = (
    notificacao: Notificacao
  ) => {
    if (notificacao.tipo === 'campanha') {
      return 'Fonte oficial: Ministério da Saúde';
    }

    if (
      notificacao.tipo === 'dose_atrasada' ||
      notificacao.tipo === 'proxima_dose' ||
        notificacao.tipo === 'alerta_vacinal'
    ) {
      return 'Registro interno do EasyVacc';
    }

    return 'EasyVacc';
  };

  const acaoNotificacao = (
    notificacao: Notificacao
  ) => {
    if (notificacao.tipo === 'campanha') {
      return 'Ver campanha';
    }

    if (
      notificacao.tipo === 'dose_atrasada' ||
      notificacao.tipo === 'proxima_dose' ||
        notificacao.tipo === 'alerta_vacinal'
    ) {
      return 'Ver caderneta';
    }

    return 'Marcar como lida';
  };

  const naoLidas = notificacoes.filter(
    (notificacao) => !notificacao.lida
  ).length;

  return (
    <div className="ev-page relative min-h-screen bg-transparent pb-16 font-sans text-slate-100 antialiased">
      <style>{`
        /* Respiro do cartão de apresentação no celular. */
        @media (max-width: 639px) {
          .easyvacc-app .ev-notificacoes-intro {
            padding: 20px 18px !important;
            margin-bottom: 18px !important;
            border-radius: 20px !important;
            min-height: 128px;
          }
          .easyvacc-app .ev-notificacoes-intro-conteudo {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            min-width: 0;
          }
          .easyvacc-app .ev-notificacoes-intro-etiqueta {
            margin: 0 !important;
            max-width: 100%;
            flex-wrap: wrap;
            line-height: 1.4;
            padding: 7px 12px;
          }
          .easyvacc-app .ev-notificacoes-intro-descricao {
            margin: 0 !important;
            line-height: 1.7 !important;
            font-size: 13px;
            overflow-wrap: anywhere;
          }
        }
        /* Barra de ações legível no tema claro, sem alterar o layout. */
        .easyvacc-light .ev-notificacoes-acoes {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }
        .easyvacc-light .ev-notificacoes-status {
          color: #334155 !important;
        }
        .easyvacc-light .ev-notificacoes-marcar {
          background-color: #eff6ff !important;
          border-color: #bfdbfe !important;
          color: #1d4ed8 !important;
        }
        .easyvacc-light .ev-notificacoes-excluir {
          background-color: #fff1f2 !important;
          border-color: #fecdd3 !important;
          color: #be123c !important;
        }
        /* Badge de notificação lida: contraste próprio em cada tema. */
        .easyvacc-light .ev-lida-badge {
          background-color: #e8f2fc !important;
          border-color: #a9c9e8 !important;
          color: #174b78 !important;
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-600/15 via-[#126ca8]/20 to-blue-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="ev-notificacoes-intro ev-page-header ev-card mb-8 rounded-2xl border border-slate-800 bg-[#081629]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="ev-notificacoes-intro-conteudo flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="ev-notificacoes-intro-etiqueta mb-2.5 inline-flex items-center gap-2 rounded-full border border-blue-600/30 bg-blue-600/10 px-3 py-1 text-xs font-medium text-[#126ca8]">
                <Sparkles size={13} aria-hidden="true" />
                <span>Central de Avisos</span>
                <ChevronRight
                  size={12}
                  className="opacity-50"
                  aria-hidden="true"
                />
                <span>EasyVacc</span>
              </div>

              <h1 className="ev-page-title text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Notificações e alertas
              </h1>

              <p className="ev-notificacoes-intro-descricao mt-1 text-sm text-slate-400">
                Avisos e lembretes importantes da sua
                caderneta e das campanhas de vacinação.
              </p>
            </div>

          </div>
        </header>

        {!carregando && notificacoes.length > 0 && (
          <div className="ev-notificacoes-acoes mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/60 bg-[#081629]/95 p-3 sm:p-4">
            <span className="ev-notificacoes-status inline-flex items-center gap-2 text-xs font-semibold text-slate-200">
              <span className={`h-2 w-2 rounded-full ${naoLidas > 0 ? 'bg-blue-400' : 'bg-slate-500'}`} />
              {naoLidas > 0 ? `${naoLidas} não lida(s)` : 'Todas lidas'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {naoLidas > 0 && (
                <button type="button" disabled={marcandoTodas || excluindoLidas}
                  onClick={() => void marcarTodasComoLidas()}
                  className="ev-notificacoes-marcar inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600/20 px-3 text-xs font-semibold text-blue-200 hover:bg-blue-600/30 disabled:opacity-50">
                  {marcandoTodas ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Marcar todas como lidas
                </button>
              )}
              {notificacoes.some((item) => item.lida) && (
                <button type="button" disabled={excluindoLidas || marcandoTodas}
                  onClick={() => void excluirNotificacoesLidas()}
                  className="ev-notificacoes-excluir inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50">
                  {excluindoLidas ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Excluir lidas
                </button>
              )}
            </div>
          </div>
        )}

        {erro && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300"
          >
            {erro}
          </div>
        )}

        {carregando ? (
          <div
            className="space-y-4"
            role="status"
            aria-live="polite"
            aria-label="Carregando notificações"
          >
            <span className="sr-only">
              Carregando notificações...
            </span>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-slate-800 bg-[#081629]/80 p-6"
              >
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-800" />

                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-40 rounded bg-slate-800" />
                    <div className="h-3 w-full rounded bg-slate-800" />
                    <div className="h-3 w-56 rounded bg-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {notificacoes.length > 0 ? (
              notificacoes.map((notif) => (
                <button
                  type="button"
                  key={notif.id}
                  disabled={abrindoId === notif.id}
                  onClick={() =>
                    void abrirNotificacao(notif)
                  }
                  className={`ev-card relative block w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 sm:p-6 ${
                    notif.lida
                      ? 'ev-card-subtle border-slate-800/80 bg-[#020817]/40 text-slate-400 hover:border-slate-700'
                      : 'border-blue-600/30 bg-[#081629]/90 text-white shadow-xl shadow-[#126ca8]/5 backdrop-blur-xl hover:border-blue-600/50'
                  } disabled:cursor-wait disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950`}
                >
                  {!notif.lida && (
                    <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-[#126ca8]" />
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        notif.lida
                          ? 'border-transparent bg-slate-800/60 text-slate-500'
                          : 'border-[#126ca8]/30 bg-[#126ca8]/10 text-[#126ca8]'
                      }`}
                    >
                      {abrindoId === notif.id ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        iconeNotificacao(notif)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3
                          className={`text-base font-bold ${
                            notif.lida
                              ? 'text-slate-300'
                              : 'text-white'
                          }`}
                        >
                          {notif.titulo}
                        </h3>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            notif.lida
                              ? 'ev-lida-badge border-[#365473] bg-[#17314f] text-[#e0efff]'
                              : 'border-blue-600/30 bg-blue-600/10 text-[#126ca8]'
                          }`}
                        >
                          {notif.lida
                            ? 'Lida'
                            : 'Não lida'}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-relaxed text-slate-400">
                        {notif.mensagem}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={13} aria-hidden="true" />
                          {formatarDataHora(
                            notif.created_at
                          )}
                        </span>

                        <span
                          className={
                            notif.tipo === 'campanha'
                              ? 'font-semibold text-blue-500'
                              : ''
                          }
                        >
                          {fonteNotificacao(notif)}
                        </span>
                      </div>

                      <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#126ca8]">
                        {notif.tipo === 'campanha' ? (
                          <ExternalLink size={13} aria-hidden="true" />
                        ) : (
                          <ChevronRight size={13} aria-hidden="true" />
                        )}

                        {acaoNotificacao(notif)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="ev-empty-state flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#081629]/60 p-12 text-center shadow-2xl backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#126ca8]/20 bg-[#126ca8]/10 text-[#126ca8]">
                  <Inbox size={24} aria-hidden="true" />
                </div>

                <h3 className="mt-4 text-base font-bold text-white">
                  Nenhuma notificação no momento
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-400">
                  Quando houver novos avisos ou lembretes cadastrados, eles aparecerão aqui.
                  Enquanto isso, você pode consultar sua caderneta.
                </p>
                <button type="button" onClick={() => navigate('/historico')} className="ev-btn-secondary mt-5 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold">
                  <Syringe size={16} aria-hidden="true" />
                  Ver minha caderneta
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}