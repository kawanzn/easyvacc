import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  ExternalLink,
  MapPin,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { supabase } from '../services/supabase';

type Campanha = {
  id: number;
  titulo: string;
  descricao: string;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  publico_alvo: string | null;
  abrangencia: string | null;
  fonte: string | null;
  fonte_url: string | null;
  imagem_url: string | null;
  destaque: boolean;
  ativa: boolean;
};

type StatusCampanha =
  | 'Campanha oficial'
  | 'Em breve'
  | 'Em andamento'
  | 'Encerrada';

type StatusSincronizacao = {
  ultima_atualizacao: string | null;
  campanhas_ativas: number;
};

function dataLocal(data: string) {
  return new Date(`${data.substring(0, 10)}T12:00:00`);
}

function formatarData(data: string | null) {
  if (!data) {
    return 'Não informado';
  }

  return dataLocal(data).toLocaleDateString('pt-BR');
}

function formatarDataSincronizacao(data: string | null) {
  if (!data) {
    return 'Não informado';
  }

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return 'Não informado';
  }

  return valor.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calcularStatus(
  campanha: Campanha
): StatusCampanha {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (
    !campanha.data_inicio &&
    !campanha.data_fim
  ) {
    return 'Campanha oficial';
  }

  if (campanha.data_inicio) {
    const inicio = dataLocal(
      campanha.data_inicio
    );

    if (hoje < inicio) {
      return 'Em breve';
    }
  }

  if (campanha.data_fim) {
    const fim = dataLocal(
      campanha.data_fim
    );

    fim.setHours(23, 59, 59, 999);

    if (hoje > fim) {
      return 'Encerrada';
    }
  }

  return 'Em andamento';
}

export default function Campanhas() {
  const [temaClaro] = useState(() => {
    return localStorage.getItem('easyvacc-tema') === 'claro';
  });

  const [searchParams] = useSearchParams();

  const [campanhas, setCampanhas] =
    useState<Campanha[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  const [
    campanhaDestacada,
    setCampanhaDestacada,
  ] = useState<number | null>(null);

  const [
    ultimaAtualizacao,
    setUltimaAtualizacao,
  ] = useState<string | null>(null);

  const [
    totalCampanhasAtivas,
    setTotalCampanhasAtivas,
  ] = useState<number | null>(null);

  const refsCampanhas = useRef<
    Record<number, HTMLElement | null>
  >({});

  const campanhaParametro =
    searchParams.get('campanha');

  const campanhaId =
    campanhaParametro &&
    /^\d+$/.test(campanhaParametro)
      ? Number(campanhaParametro)
      : null;

  useEffect(() => {
    void carregarDados();
  }, []);

  useEffect(() => {
    if (
      carregando ||
      campanhas.length === 0 ||
      campanhaId === null
    ) {
      return;
    }

    const existe = campanhas.some(
      (campanha) =>
        campanha.id === campanhaId
    );

    if (!existe) {
      setCampanhaDestacada(null);
      return;
    }

    setCampanhaDestacada(
      campanhaId
    );

    const timer =
      window.setTimeout(() => {
        refsCampanhas.current[
          campanhaId
        ]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 150);

    const removerDestaque =
      window.setTimeout(() => {
        setCampanhaDestacada(null);
      }, 5000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(
        removerDestaque
      );
    };
  }, [
    carregando,
    campanhas,
    campanhaId,
  ]);

  async function carregarDados() {
    setCarregando(true);
    setErro('');

    try {
      await Promise.all([
        carregarCampanhas(),
        carregarStatusSincronizacao(),
      ]);
    } catch (error) {
      console.error(
        'Erro ao carregar dados das campanhas:',
        error
      );

      setErro(
        'Não foi possível carregar as campanhas. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarCampanhas() {
    const { data, error } =
      await supabase
        .from('campanhas')
        .select(`
          id,
          titulo,
          descricao,
          data_inicio,
          data_fim,
          status,
          publico_alvo,
          abrangencia,
          fonte,
          fonte_url,
          imagem_url,
          destaque,
          ativa
        `)
        .eq('ativa', true)
        .order('destaque', {
          ascending: false,
        })
        .order('data_inicio', {
          ascending: false,
        });

    if (error) {
      console.error(
        'Erro ao carregar campanhas:',
        error
      );

      throw error;
    }

    setCampanhas(
      (data ?? []) as Campanha[]
    );
  }

  async function carregarStatusSincronizacao() {
    const { data, error } =
      await supabase.rpc(
        'status_sincronizacao_campanhas'
      );

    if (error) {
      console.error(
        'Erro ao carregar status da sincronização das campanhas:',
        error
      );

      /*
       * A falha dos metadados não deve impedir
       * que as campanhas sejam exibidas.
       */
      return;
    }

    const status =
      (data?.[0] ??
        null) as StatusSincronizacao | null;

    if (!status) {
      return;
    }

    setUltimaAtualizacao(
      status.ultima_atualizacao
    );

    setTotalCampanhasAtivas(
      Number(
        status.campanhas_ativas
      )
    );
  }

  function estiloStatus(
    status: StatusCampanha
  ) {
    switch (status) {
      case 'Campanha oficial':
        return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';

      case 'Em andamento':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';

      case 'Em breve':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-300';

      case 'Encerrada':
        return 'border-slate-600 bg-slate-800 text-slate-400';

      default:
        return 'border-slate-600 bg-slate-800 text-slate-400';
    }
  }

  return (
    <div className={`relative min-h-screen w-full bg-slate-950 text-slate-100 antialiased ${temaClaro ? 'easyvacc-campanhas-light' : ''}`}>
      <style>{`
        .easyvacc-campanhas-light {
          background: #f8fafc !important;
          color: #0f172a !important;
        }
        .easyvacc-campanhas-light .text-white,
        .easyvacc-campanhas-light .text-slate-100 {
          color: #0f172a !important;
        }
        .easyvacc-campanhas-light .text-slate-200,
        .easyvacc-campanhas-light .text-slate-300 {
          color: #334155 !important;
        }
        .easyvacc-campanhas-light .text-slate-400 {
          color: #475569 !important;
        }
        .easyvacc-campanhas-light .text-slate-500 {
          color: #64748b !important;
        }
        .easyvacc-campanhas-light [class~="bg-slate-900"],
        .easyvacc-campanhas-light [class~="bg-slate-900/60"],
        .easyvacc-campanhas-light [class~="bg-slate-900/70"],
        .easyvacc-campanhas-light [class~="bg-slate-900/80"],
        .easyvacc-campanhas-light [class~="bg-slate-900/90"] {
          background-color: #ffffff !important;
        }
        .easyvacc-campanhas-light [class~="bg-slate-950"],
        .easyvacc-campanhas-light [class~="bg-slate-950/40"],
        .easyvacc-campanhas-light [class~="bg-slate-950/50"],
        .easyvacc-campanhas-light [class~="bg-slate-950/60"] {
          background-color: #f8fafc !important;
        }
        .easyvacc-campanhas-light [class~="bg-slate-800"] {
          background-color: #f1f5f9 !important;
        }
        .easyvacc-campanhas-light [class~="border-slate-800"],
        .easyvacc-campanhas-light [class~="border-slate-700"],
        .easyvacc-campanhas-light [class~="border-slate-600"] {
          border-color: #cbd5e1 !important;
        }
        .easyvacc-campanhas-light [class~="hover:text-white"]:hover {
          color: #0f172a !important;
        }
        .easyvacc-campanhas-light [class~="hover:bg-slate-800"]:hover,
        .easyvacc-campanhas-light [class~="hover:bg-slate-900"]:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/10 via-[#00a884]/15 to-cyan-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-[#00a884]">
            <Sparkles size={13}  aria-hidden="true" />
            <span>
              Informativo EasyVacc
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Campanhas de Vacinação
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Consulte campanhas e ações de
            vacinação disponibilizadas no
            EasyVacc a partir de fontes
            oficiais.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-cyan-400"
           aria-hidden="true" />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-cyan-200">
              Dados de campanhas de vacinação
            </p>

            <p className="mt-0.5 text-xs leading-5 text-slate-400">
              Fonte: Ministério da Saúde.
              As campanhas exibidas nesta
              página são sincronizadas pelo
              EasyVacc a partir de páginas
              públicas oficiais.
            </p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>
                Última sincronização registrada
                no EasyVacc:{' '}
                <strong className="font-semibold text-slate-300">
                  {formatarDataSincronizacao(
                    ultimaAtualizacao
                  )}
                </strong>
              </span>

              {totalCampanhasAtivas !==
                null && (
                <span>
                  Campanhas ativas:{' '}
                  <strong className="font-semibold text-slate-300">
                    {totalCampanhasAtivas.toLocaleString(
                      'pt-BR'
                    )}
                  </strong>
                </span>
              )}
            </div>

            <p className="mt-2 text-[11px] leading-4 text-slate-600">
              A data acima corresponde à
              última sincronização registrada
              pelo EasyVacc e não
              necessariamente à data de
              publicação ou atualização
              original da campanha pelo
              Ministério da Saúde.
            </p>
          </div>
        </div>

        {carregando && (
          <div
            role="status"
            aria-live="polite"
            aria-label="Carregando campanhas"
          >
            <span className="sr-only">
              Carregando campanhas...
            </span>

            <div
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
              aria-hidden="true"
            >
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"
                >
                  <div className="h-40 animate-pulse bg-slate-800/70" />

                  <div className="p-6">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-800" />

                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-full animate-pulse rounded bg-slate-800/70" />
                      <div className="h-3 w-11/12 animate-pulse rounded bg-slate-800/70" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800/70" />
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800/60" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800/60" />
                      <div className="h-4 w-3/5 animate-pulse rounded bg-slate-800/60" />
                    </div>

                    <div className="mt-6 border-t border-slate-800 pt-4">
                      <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!carregando && erro && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-900 bg-rose-950/40 p-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={22}
                className="mt-0.5 shrink-0 text-rose-400"
               aria-hidden="true" />

              <div>
                <h2 className="font-bold text-rose-300">
                  Não foi possível carregar
                </h2>

                <p className="mt-1 text-sm text-rose-300/80">
                  {erro}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void carregarDados()
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-800 bg-rose-950 px-4 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  <RefreshCw
                    size={14}
                   aria-hidden="true" />
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {!carregando &&
          !erro && (
          <>
            {campanhaId !== null &&
              campanhas.length > 0 &&
              !campanhas.some(
                (campanha) =>
                  campanha.id ===
                  campanhaId
              ) && (
                <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                  A campanha vinculada à
                  notificação não está mais
                  disponível entre as
                  campanhas ativas.
                </div>
              )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {campanhas.length >
              0 ? (
                campanhas.map(
                  (campanha) => {
                    const status =
                      calcularStatus(
                        campanha
                      );

                    const selecionada =
                      campanhaDestacada ===
                      campanha.id;

                    return (
                      <article
                        id={`campanha-${campanha.id}`}
                        key={
                          campanha.id
                        }
                        ref={(
                          elemento
                        ) => {
                          refsCampanhas.current[
                            campanha.id
                          ] =
                            elemento;
                        }}
                        className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-slate-900/60 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-0.5 hover:shadow-2xl ${
                          selecionada
                            ? 'scale-[1.01] border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-500/10'
                            : campanha.destaque
                              ? 'border-emerald-800/80 hover:border-emerald-700'
                              : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {selecionada && (
                          <div className="absolute right-3 top-3 z-30 rounded-full border border-emerald-400/40 bg-slate-950/90 px-3 py-1 text-[11px] font-bold text-emerald-300 shadow-lg backdrop-blur">
                            Campanha da
                            notificação
                          </div>
                        )}

                        {campanha.imagem_url ? (
                          <div className="relative h-48 overflow-hidden border-b border-slate-800">
                            <img
                              src={
                                campanha.imagem_url
                              }
                              alt={
                                campanha.titulo
                              }
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                            <div className="absolute bottom-4 left-4 right-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estiloStatus(
                                  status
                                )}`}
                              >
                                {
                                  status
                                }
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative flex h-40 flex-col justify-between overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 p-6">
                            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-[#00a884]/10 blur-2xl transition-all group-hover:bg-[#00a884]/20" />

                            <div className="z-10 flex items-center justify-between">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${estiloStatus(
                                  status
                                )}`}
                              >
                                {
                                  status
                                }
                              </span>

                              <Megaphone
                                size={
                                  21
                                }
                                className="text-[#00a884]"
                               aria-hidden="true" />
                            </div>

                            <h2 className="z-10 text-xl font-bold tracking-tight text-white">
                              {
                                campanha.titulo
                              }
                            </h2>
                          </div>
                        )}

                        <div className="flex flex-1 flex-col p-6">
                          {campanha.destaque && (
                            <div className="mb-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
                                <Sparkles
                                  size={
                                    11
                                  }
                                 aria-hidden="true" />
                                Destaque
                              </span>
                            </div>
                          )}

                          {campanha.imagem_url && (
                            <h2 className="mb-3 text-xl font-bold text-white">
                              {
                                campanha.titulo
                              }
                            </h2>
                          )}

                          <p className="text-sm leading-relaxed text-slate-300">
                            {
                              campanha.descricao
                            }
                          </p>

                          <div className="mt-5 space-y-3">
                            {campanha.publico_alvo && (
                              <div className="flex items-start gap-2 text-sm text-slate-400">
                                <Users
                                  size={
                                    16
                                  }
                                  className="mt-0.5 shrink-0 text-[#00a884]"
                                 aria-hidden="true" />

                                <div>
                                  <span className="text-slate-500">
                                    Público-alvo:
                                  </span>{' '}

                                  <span className="text-slate-300">
                                    {
                                      campanha.publico_alvo
                                    }
                                  </span>
                                </div>
                              </div>
                            )}

                            {campanha.abrangencia && (
                              <div className="flex items-start gap-2 text-sm text-slate-400">
                                <MapPin
                                  size={
                                    16
                                  }
                                  className="mt-0.5 shrink-0 text-[#00a884]"
                                 aria-hidden="true" />

                                <div>
                                  <span className="text-slate-500">
                                    Abrangência:
                                  </span>{' '}

                                  <span className="text-slate-300">
                                    {
                                      campanha.abrangencia
                                    }
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start gap-2 text-sm text-slate-400">
                              <Calendar
                                size={
                                  16
                                }
                                className="mt-0.5 shrink-0 text-[#00a884]"
                               aria-hidden="true" />

                              <div>
                                <span className="text-slate-500">
                                  Período:
                                </span>{' '}

                                {!campanha.data_inicio &&
                                !campanha.data_fim ? (
                                  <span className="text-slate-300">
                                    Não
                                    informado
                                    pela fonte
                                  </span>
                                ) : (
                                  <>
                                    <span className="text-slate-300">
                                      {formatarData(
                                        campanha.data_inicio
                                      )}
                                    </span>

                                    {campanha.data_fim && (
                                      <>
                                        {' até '}

                                        <span className="text-slate-300">
                                          {formatarData(
                                            campanha.data_fim
                                          )}
                                        </span>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto pt-5">
                            <div className="border-t border-slate-800 pt-4">
                              {campanha.fonte && (
                                <p className="mb-3 text-xs text-slate-500">
                                  Fonte:{' '}

                                  <span className="text-slate-400">
                                    {
                                      campanha.fonte
                                    }
                                  </span>
                                </p>
                              )}

                              {campanha.fonte_url && (
                                <a
                                  href={
                                    campanha.fonte_url
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-2.5 text-xs font-bold text-emerald-400 transition hover:border-emerald-700 hover:bg-emerald-950/60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                                >
                                  <ExternalLink
                                    size={
                                      14
                                    }
                                   aria-hidden="true" />
                                  Ver fonte
                                  oficial
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center">
                  <Megaphone
                    size={32}
                    className="mx-auto text-slate-600"
                   aria-hidden="true" />

                  <h2 className="mt-4 font-bold text-slate-300">
                    Nenhuma campanha
                    disponível
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Não há campanhas
                    ativas cadastradas no
                    EasyVacc neste
                    momento.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}