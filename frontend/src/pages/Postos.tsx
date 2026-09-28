import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  Building2,
  ExternalLink,
  LocateFixed,
  Loader2,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../services/supabase';

type Posto = {
  id: number;
  cnes: string;
  codigo_ibge: string | null;
  nome: string;
  nome_empresarial: string | null;
  tipo: string | null;
  classificacao: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  cep: string | null;
  telefone: string | null;
  latitude: number;
  longitude: number;
  distanciaKm?: number;
  fonte: string;
  municipio?: string | null;
  uf?: string | null;
};

type RespostaPostos = {
  sucesso: boolean;
  localizacao?: {
    latitude: number;
    longitude: number;
  };
  raioKm?: number;
  totalPostosBanco?: number;
  totalEncontrado?: number;
  postos?: Posto[];
  erro?: string;
};

type ModoBusca = 'localizacao' | 'manual' | null;

type StatusSincronizacao = {
  ultima_atualizacao: string | null;
  postos_ativos: number;
};

export default function Postos() {
  const [postos, setPostos] = useState<Posto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [modoBusca, setModoBusca] = useState<ModoBusca>(null);
  const [raioKm, setRaioKm] = useState<number | null>(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [termoPesquisado, setTermoPesquisado] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);
  const [totalPostosAtivos, setTotalPostosAtivos] = useState<number | null>(null);

  useEffect(() => {
    void carregarStatusSincronizacao();
  }, []);

  async function carregarStatusSincronizacao() {
    try {
      const { data, error } = await supabase.rpc(
        'status_sincronizacao_postos'
      );

      if (error) {
        console.error(
          'Erro ao carregar status da sincronização:',
          error
        );
        return;
      }

      const status = (data?.[0] ?? null) as StatusSincronizacao | null;

      if (!status) {
        return;
      }

      setUltimaAtualizacao(status.ultima_atualizacao);
      setTotalPostosAtivos(Number(status.postos_ativos));
    } catch (error) {
      console.error(
        'Erro ao carregar status da sincronização:',
        error
      );
    }
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

  function formatarDistancia(distanciaKm?: number) {
    if (
      distanciaKm === undefined ||
      distanciaKm === null ||
      Number.isNaN(distanciaKm)
    ) {
      return null;
    }

    if (distanciaKm < 1) {
      return `${Math.round(distanciaKm * 1000)} m`;
    }

    return `${distanciaKm.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} km`;
  }

  function formatarCep(cep: string | null) {
    if (!cep) {
      return null;
    }

    const somenteNumeros = cep.replace(/\D/g, '');

    if (somenteNumeros.length !== 8) {
      return cep;
    }

    return `${somenteNumeros.slice(0, 5)}-${somenteNumeros.slice(5)}`;
  }

  function montarEndereco(posto: Posto) {
    const enderecoPrincipal = [
      posto.logradouro,
      posto.numero,
    ]
      .filter(Boolean)
      .join(', ');

    const localidade = [
      posto.municipio,
      posto.uf,
    ]
      .filter(Boolean)
      .join(' - ');

    const cepFormatado = formatarCep(posto.cep);

    const partes = [
      enderecoPrincipal || null,
      posto.complemento,
      localidade || null,
      cepFormatado ? `CEP ${cepFormatado}` : null,
    ].filter(Boolean);

    if (partes.length === 0) {
      return 'Endereço não informado';
    }

    return partes.join(' - ');
  }

  async function buscarPostos(
    latitude: number,
    longitude: number
  ) {
    try {
      const { data, error } =
        await supabase.functions.invoke<RespostaPostos>(
          'buscar-postos-proximos',
          {
            body: {
              latitude,
              longitude,
              limite: 10,
            },
          }
        );

      if (error) {
        console.error(
          'Erro da Edge Function:',
          error
        );

        throw new Error(
          'Não foi possível consultar as unidades de saúde.'
        );
      }

      if (!data?.sucesso) {
        throw new Error(
          data?.erro ||
            'Não foi possível localizar unidades próximas.'
        );
      }

      setPostos(data.postos ?? []);
      setRaioKm(data.raioKm ?? null);
      setModoBusca('localizacao');
      setTermoPesquisado('');
    } catch (error) {
      console.error(
        'Erro ao buscar postos:',
        error
      );

      setPostos([]);
      setRaioKm(null);
      setModoBusca(null);

      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao buscar unidades de saúde.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function usarMinhaLocalizacao() {
    setErro('');
    setCarregando(true);

    if (!navigator.geolocation) {
      setErro(
        'Seu navegador não oferece suporte à localização. Você pode pesquisar manualmente por CEP, cidade, bairro ou unidade.'
      );

      setCarregando(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        void buscarPostos(
          latitude,
          longitude
        );
      },
      (error) => {
        console.error(
          'Erro de geolocalização:',
          error
        );

        let mensagem =
          'Não foi possível obter sua localização. Você pode usar a busca manual abaixo.';

        if (error.code === 1) {
          mensagem =
            'A permissão de localização foi negada. Você ainda pode pesquisar por CEP, cidade, bairro ou unidade.';
        }

        if (error.code === 2) {
          mensagem =
            'Sua localização não pôde ser determinada. Utilize a busca manual por CEP, cidade, bairro ou unidade.';
        }

        if (error.code === 3) {
          mensagem =
            'O tempo para obter sua localização expirou. Tente novamente ou utilize a busca manual.';
        }

        setErro(mensagem);
        setCarregando(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }

  async function buscarManual(event?: FormEvent) {
    event?.preventDefault();

    const termo = termoBusca.trim();

    setErro('');

    if (termo.length < 2) {
      setErro(
        'Digite um CEP, cidade, bairro, logradouro ou nome da unidade.'
      );
      return;
    }

    setCarregando(true);

    try {
      const { data, error } = await supabase.rpc(
        'buscar_postos_manual',
        {
          termo_busca: termo,
          limite_resultados: 30,
        }
      );

      if (error) {
        console.error(
          'Erro na busca manual:',
          error
        );

        throw new Error(
          'Não foi possível realizar a busca manual.'
        );
      }

      const resultado = (data ?? []) as Posto[];

      setPostos(resultado);
      setRaioKm(null);
      setModoBusca('manual');
      setTermoPesquisado(termo);
    } catch (error) {
      console.error(
        'Erro ao pesquisar postos:',
        error
      );

      setPostos([]);
      setRaioKm(null);
      setModoBusca(null);

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível pesquisar as unidades de saúde.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function limparBuscaManual() {
    setTermoBusca('');
    setTermoPesquisado('');
    setPostos([]);
    setRaioKm(null);
    setModoBusca(null);
    setErro('');
  }

  function abrirRota(posto: Posto) {
    if (
      typeof posto.latitude !== 'number' ||
      typeof posto.longitude !== 'number'
    ) {
      setErro(
        'Esta unidade não possui coordenadas disponíveis para abrir a rota.'
      );
      return;
    }

    const destino =
      `${posto.latitude},${posto.longitude}`;

    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destino
      )}`;

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function ligar(telefone: string) {
    const telefoneLimpo =
      telefone.replace(/[^\d+]/g, '');

    window.location.href =
      `tel:${telefoneLimpo}`;
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/10 via-[#00a884]/15 to-cyan-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-[#00a884]">
            <Sparkles size={13} />
            <span>
              Rede de Atendimento
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Postos de Saúde e UBS
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Encontre unidades de saúde usando sua localização
            atual ou pesquise manualmente por CEP, cidade,
            bairro, logradouro ou nome da unidade.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
            <form
              onSubmit={(event) =>
                void buscarManual(event)
              }
              className="flex flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="search"
                  value={termoBusca}
                  onChange={(event) =>
                    setTermoBusca(
                      event.target.value
                    )
                  }
                  disabled={carregando}
                  placeholder="CEP, cidade, bairro ou unidade"
                  aria-label="Buscar posto de saúde"
                  className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#00a884] px-5 text-sm font-bold text-white transition hover:bg-[#009578] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando &&
                modoBusca !== 'localizacao' ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Search size={18} />
                )}

                Buscar
              </button>
            </form>

            <button
              type="button"
              onClick={usarMinhaLocalizacao}
              disabled={carregando}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 text-sm font-bold text-[#00a884] transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando &&
              modoBusca !== 'manual' ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Localizando...
                </>
              ) : modoBusca === 'localizacao' ? (
                <>
                  <RefreshCw size={18} />
                  Atualizar localização
                </>
              ) : (
                <>
                  <LocateFixed size={18} />
                  Usar minha localização
                </>
              )}
            </button>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            A busca manual não exige acesso à localização do
            dispositivo.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-cyan-400"
          />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-cyan-200">
              Dados de unidades de saúde
            </p>

            <p className="mt-0.5 text-xs leading-5 text-slate-400">
              Fonte: Ministério da Saúde / CNES.
              As unidades exibidas pelo EasyVacc são
              sincronizadas a partir dessa base oficial.
            </p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>
                Última sincronização registrada no EasyVacc:{' '}
                <strong className="font-semibold text-slate-300">
                  {formatarDataSincronizacao(
                    ultimaAtualizacao
                  )}
                </strong>
              </span>

              {totalPostosAtivos !== null && (
                <span>
                  Unidades ativas:{' '}
                  <strong className="font-semibold text-slate-300">
                    {totalPostosAtivos.toLocaleString(
                      'pt-BR'
                    )}
                  </strong>
                </span>
              )}
            </div>

            <p className="mt-2 text-[11px] leading-4 text-slate-600">
              A data acima corresponde à última
              sincronização registrada pelo EasyVacc e
              não necessariamente à data de atualização
              original de cada estabelecimento no CNES.
            </p>
          </div>
        </div>

        {erro && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div>
              <p className="text-sm font-semibold text-red-300">
                Não foi possível concluir a busca
              </p>

              <p className="mt-1 text-sm text-red-200/70">
                {erro}
              </p>
            </div>
          </div>
        )}

        {carregando && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2
              size={34}
              className="animate-spin text-[#00a884]"
            />

            <p className="mt-4 text-sm font-medium">
              Procurando unidades de saúde...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Consultando unidades cadastradas no EasyVacc.
            </p>
          </div>
        )}

        {!carregando &&
          modoBusca === null &&
          !erro && (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500">
                <MapPinned size={28} />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-200">
                Encontre uma unidade de saúde
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Pesquise por CEP, cidade, bairro ou unidade.
                Se preferir encontrar os postos mais próximos,
                use a localização do seu dispositivo.
              </p>
            </div>
          )}

        {!carregando &&
          modoBusca !== null &&
          postos.length > 0 && (
            <>
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-semibold text-white">
                    {modoBusca === 'localizacao'
                      ? 'Unidades próximas'
                      : 'Resultado da busca'}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {postos.length}{' '}
                    {postos.length === 1
                      ? 'unidade encontrada'
                      : 'unidades encontradas'}

                    {modoBusca === 'manual' &&
                      termoPesquisado && (
                        <>
                          {' para '}
                          <span className="font-semibold text-slate-400">
                            “{termoPesquisado}”
                          </span>
                        </>
                      )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {modoBusca === 'localizacao' &&
                    raioKm !== null && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPinned size={14} />
                        Busca em até {raioKm} km
                      </div>
                    )}

                  {modoBusca === 'manual' && (
                    <button
                      type="button"
                      onClick={limparBuscaManual}
                      className="text-xs font-semibold text-[#00a884] hover:underline"
                    >
                      Limpar busca
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {postos.map(
                  (posto, index) => {
                    const distancia =
                      formatarDistancia(
                        posto.distanciaKm
                      );

                    return (
                      <div
                        key={
                          posto.id ??
                          posto.cnes ??
                          `${posto.latitude}-${posto.longitude}`
                        }
                        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md transition-all hover:border-slate-700 md:p-7"
                      >
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              {modoBusca === 'localizacao' &&
                                distancia && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-[#00a884]">
                                    <Navigation
                                      size={12}
                                    />
                                    {distancia} de você
                                  </span>
                                )}

                              {modoBusca === 'localizacao' &&
                                index === 0 && (
                                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                    Mais próxima
                                  </span>
                                )}

                              {modoBusca === 'manual' &&
                                posto.municipio && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                    <MapPin
                                      size={12}
                                    />
                                    {posto.municipio}
                                    {posto.uf
                                      ? ` - ${posto.uf}`
                                      : ''}
                                  </span>
                                )}
                            </div>

                            <h2 className="text-xl font-bold tracking-tight text-white">
                              {posto.nome}
                            </h2>

                            {(posto.classificacao ||
                              posto.tipo) && (
                              <p className="mt-1 text-xs text-slate-500">
                                {posto.classificacao ||
                                  posto.tipo}
                              </p>
                            )}

                            <div className="mt-4 space-y-2.5">
                              <p className="flex items-start gap-2 text-sm text-slate-300">
                                <MapPin
                                  size={16}
                                  className="mt-0.5 shrink-0 text-[#00a884]"
                                />

                                <span>
                                  {montarEndereco(
                                    posto
                                  )}
                                </span>
                              </p>

                              {posto.telefone && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    ligar(
                                      posto.telefone!
                                    )
                                  }
                                  className="flex items-center gap-2 text-left text-sm text-slate-300 transition hover:text-[#00a884]"
                                >
                                  <Phone
                                    size={15}
                                    className="shrink-0 text-[#00a884]"
                                  />

                                  {posto.telefone}
                                </button>
                              )}

                              {posto.cnes && (
                                <p className="flex items-center gap-2 text-xs text-slate-500">
                                  <Building2
                                    size={14}
                                    className="shrink-0"
                                  />
                                  CNES: {posto.cnes}
                                </p>
                              )}
                            </div>

                            <p className="mt-3 text-[11px] text-slate-600">
                              Fonte:{' '}
                              {posto.fonte ||
                                'Ministério da Saúde / CNES'}
                            </p>
                          </div>

                          <div className="shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                abrirRota(
                                  posto
                                )
                              }
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-[#00a884] transition hover:bg-emerald-500/20 md:w-auto"
                            >
                              <Navigation
                                size={17}
                              />
                              Como chegar
                              <ExternalLink
                                size={14}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}

        {!carregando &&
          modoBusca !== null &&
          postos.length === 0 &&
          !erro && (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <Building2
                size={34}
                className="mx-auto text-slate-600"
              />

              <p className="mt-3 text-sm font-medium text-slate-400">
                {modoBusca === 'manual'
                  ? 'Nenhuma unidade foi encontrada para essa busca.'
                  : 'Nenhuma UBS foi encontrada próxima à sua localização.'}
              </p>

              {modoBusca === 'manual' && (
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                  Tente pesquisar pelo nome da cidade,
                  CEP, logradouro ou nome da unidade.
                </p>
              )}

              {modoBusca === 'localizacao' &&
                raioKm !== null && (
                  <p className="mt-2 text-xs text-slate-500">
                    Foram verificadas unidades
                    em um raio de até {raioKm} km.
                  </p>
                )}

              {modoBusca === 'manual' ? (
                <button
                  type="button"
                  onClick={limparBuscaManual}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#00a884] hover:underline"
                >
                  <RefreshCw size={15} />
                  Fazer outra busca
                </button>
              ) : (
                <button
                  type="button"
                  onClick={usarMinhaLocalizacao}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#00a884] hover:underline"
                >
                  <RefreshCw size={15} />
                  Tentar novamente
                </button>
              )}
            </div>
          )}
      </div>
    </div>
  );
}