import { useEffect, useState } from 'react';
import {
  Calendar,
  Megaphone,
  Sparkles,
  Loader2,
  Users,
  MapPin,
  ExternalLink,
  AlertCircle,
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

function dataLocal(data: string) {
  return new Date(`${data.substring(0, 10)}T12:00:00`);
}

function formatarData(data: string | null) {
  if (!data) return 'Não informado';

  return dataLocal(data).toLocaleDateString('pt-BR');
}

function calcularStatus(campanha: Campanha): StatusCampanha {
  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);

  // Se a fonte oficial não informou período,
  // não afirmamos que a campanha está em andamento.
  if (!campanha.data_inicio && !campanha.data_fim) {
    return 'Campanha oficial';
  }

  if (campanha.data_inicio) {
    const inicio = dataLocal(campanha.data_inicio);

    if (hoje < inicio) {
      return 'Em breve';
    }
  }

  if (campanha.data_fim) {
    const fim = dataLocal(campanha.data_fim);

    fim.setHours(23, 59, 59, 999);

    if (hoje > fim) {
      return 'Encerrada';
    }
  }

  return 'Em andamento';
}

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    void carregarCampanhas();
  }, []);

  async function carregarCampanhas() {
    setCarregando(true);
    setErro('');

    try {
      const { data, error } = await supabase
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
        .order('destaque', { ascending: false })
        .order('data_inicio', { ascending: false });

      if (error) {
        console.error('Erro ao carregar campanhas:', error);

        throw new Error(
          'Não foi possível carregar as campanhas.'
        );
      }

      setCampanhas((data ?? []) as Campanha[]);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as campanhas.'
      );

      setCampanhas([]);
    } finally {
      setCarregando(false);
    }
  }

  function estiloStatus(status: StatusCampanha) {
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
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 antialiased">
      {/* FUNDO */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/10 via-[#00a884]/15 to-cyan-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">

        {/* CABEÇALHO */}

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl md:p-8">

          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-[#00a884]">
            <Sparkles size={13} />

            <span>Informativo EasyVacc</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Campanhas de Vacinação
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Consulte campanhas e ações de vacinação disponíveis
            no EasyVacc.
          </p>
        </div>

        {/* CARREGANDO */}

        {carregando && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2
              size={32}
              className="animate-spin text-[#00a884]"
            />

            <p className="mt-3 text-sm font-medium">
              Carregando campanhas...
            </p>
          </div>
        )}

        {/* ERRO */}

        {!carregando && erro && (
          <div className="rounded-2xl border border-rose-900 bg-rose-950/40 p-6">

            <div className="flex items-start gap-3">
              <AlertCircle
                size={22}
                className="mt-0.5 shrink-0 text-rose-400"
              />

              <div>
                <h2 className="font-bold text-rose-300">
                  Não foi possível carregar
                </h2>

                <p className="mt-1 text-sm text-rose-300/80">
                  {erro}
                </p>

                <button
                  type="button"
                  onClick={() => void carregarCampanhas()}
                  className="mt-4 rounded-xl border border-rose-800 bg-rose-950 px-4 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-900"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CAMPANHAS */}

        {!carregando && !erro && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {campanhas.length > 0 ? (
              campanhas.map((campanha) => {
                const status = calcularStatus(campanha);

                return (
                  <article
                    key={campanha.id}
                    className={`group flex flex-col overflow-hidden rounded-2xl border bg-slate-900/60 shadow-xl backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-2xl ${
                      campanha.destaque
                        ? 'border-emerald-800/80'
                        : 'border-slate-800'
                    }`}
                  >

                    {/* IMAGEM OU CABEÇALHO */}

                    {campanha.imagem_url ? (
                      <div className="relative h-48 overflow-hidden border-b border-slate-800">

                        <img
                          src={campanha.imagem_url}
                          alt={campanha.titulo}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                        <div className="absolute bottom-4 left-4 right-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estiloStatus(
                              status
                            )}`}
                          >
                            {status}
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
                            {status}
                          </span>

                          <Megaphone
                            size={21}
                            className="text-[#00a884]"
                          />
                        </div>

                        <h2 className="z-10 text-xl font-bold tracking-tight text-white">
                          {campanha.titulo}
                        </h2>
                      </div>
                    )}

                    {/* CONTEÚDO */}

                    <div className="flex flex-1 flex-col p-6">

                      {campanha.destaque && (
                        <div className="mb-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
                            <Sparkles size={11} />
                            Destaque
                          </span>
                        </div>
                      )}

                      {campanha.imagem_url && (
                        <h2 className="mb-3 text-xl font-bold text-white">
                          {campanha.titulo}
                        </h2>
                      )}

                      <p className="text-sm leading-relaxed text-slate-300">
                        {campanha.descricao}
                      </p>

                      {/* INFORMAÇÕES */}

                      <div className="mt-5 space-y-3">

                        {campanha.publico_alvo && (
                          <div className="flex items-start gap-2 text-sm text-slate-400">
                            <Users
                              size={16}
                              className="mt-0.5 shrink-0 text-[#00a884]"
                            />

                            <div>
                              <span className="text-slate-500">
                                Público-alvo:
                              </span>{' '}

                              <span className="text-slate-300">
                                {campanha.publico_alvo}
                              </span>
                            </div>
                          </div>
                        )}

                        {campanha.abrangencia && (
                          <div className="flex items-start gap-2 text-sm text-slate-400">
                            <MapPin
                              size={16}
                              className="mt-0.5 shrink-0 text-[#00a884]"
                            />

                            <div>
                              <span className="text-slate-500">
                                Abrangência:
                              </span>{' '}

                              <span className="text-slate-300">
                                {campanha.abrangencia}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2 text-sm text-slate-400">
                          <Calendar
                            size={16}
                            className="mt-0.5 shrink-0 text-[#00a884]"
                          />

                          <div>
                            <span className="text-slate-500">
                              Período:
                            </span>{' '}

                            <span className="text-slate-300">
                              {formatarData(campanha.data_inicio)}
                            </span>

                            {campanha.data_fim && (
                              <>
                                {' até '}

                                <span className="text-slate-300">
                                  {formatarData(campanha.data_fim)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* FONTE */}

                      <div className="mt-auto pt-5">

                        <div className="border-t border-slate-800 pt-4">

                          {campanha.fonte && (
                            <p className="mb-3 text-xs text-slate-500">
                              Fonte:{' '}

                              <span className="text-slate-400">
                                {campanha.fonte}
                              </span>
                            </p>
                          )}

                          {campanha.fonte_url && (
                            <a
                              href={campanha.fonte_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-2.5 text-xs font-bold text-emerald-400 transition hover:border-emerald-700 hover:bg-emerald-950/60"
                            >
                              <ExternalLink size={14} />

                              Ver fonte oficial
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center">

                <Megaphone
                  size={32}
                  className="mx-auto text-slate-600"
                />

                <h2 className="mt-4 font-bold text-slate-300">
                  Nenhuma campanha disponível
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Não há campanhas cadastradas no EasyVacc neste momento.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}