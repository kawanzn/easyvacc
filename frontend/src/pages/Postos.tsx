import { useState } from 'react';
import {
  MapPin,
  Building2,
  Sparkles,
  Loader2,
  Navigation,
  LocateFixed,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Phone,
  MapPinned,
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
  distanciaKm: number;
  fonte: string;
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

export default function Postos() {
  const [postos, setPostos] = useState<Posto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [localizacaoObtida, setLocalizacaoObtida] =
    useState(false);

  const [raioKm, setRaioKm] = useState<number | null>(
    null
  );

  // ============================================
  // FORMATAR DISTÂNCIA
  // ============================================

  function formatarDistancia(distanciaKm: number) {
    if (distanciaKm < 1) {
      return `${Math.round(distanciaKm * 1000)} m`;
    }

    return `${distanciaKm.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} km`;
  }

  // ============================================
  // FORMATAR CEP
  // ============================================

  function formatarCep(cep: string | null) {
    if (!cep) {
      return null;
    }

    const somenteNumeros = cep.replace(/\D/g, '');

    if (somenteNumeros.length !== 8) {
      return cep;
    }

    return `${somenteNumeros.slice(
      0,
      5
    )}-${somenteNumeros.slice(5)}`;
  }

  // ============================================
  // MONTAR ENDEREÇO
  // ============================================

  function montarEndereco(posto: Posto) {
    const enderecoPrincipal = [
      posto.logradouro,
      posto.numero,
    ]
      .filter(Boolean)
      .join(', ');

    const partes = [
      enderecoPrincipal || null,
      posto.complemento,
      formatarCep(posto.cep)
        ? `CEP ${formatarCep(posto.cep)}`
        : null,
    ].filter(Boolean);

    if (partes.length === 0) {
      return 'Endereço não informado';
    }

    return partes.join(' - ');
  }

  // ============================================
  // BUSCAR POSTOS NA EDGE FUNCTION
  // ============================================

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
      setLocalizacaoObtida(true);
    } catch (error) {
      console.error(
        'Erro ao buscar postos:',
        error
      );

      setPostos([]);
      setRaioKm(null);
      setLocalizacaoObtida(false);

      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao buscar unidades de saúde.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ============================================
  // OBTER LOCALIZAÇÃO DO NAVEGADOR
  // ============================================

  function usarMinhaLocalizacao() {
    setErro('');
    setCarregando(true);

    if (!navigator.geolocation) {
      setErro(
        'Seu navegador não oferece suporte à localização.'
      );

      setCarregando(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        console.log(
          'Localização obtida:',
          latitude,
          longitude
        );

        buscarPostos(
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
          'Não foi possível obter sua localização.';

        if (error.code === 1) {
          mensagem =
            'A permissão de localização foi negada. Permita o acesso à localização no navegador e tente novamente.';
        }

        if (error.code === 2) {
          mensagem =
            'Sua localização não pôde ser determinada.';
        }

        if (error.code === 3) {
          mensagem =
            'O tempo para obter sua localização expirou. Tente novamente.';
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

  // ============================================
  // ABRIR ROTA NO GOOGLE MAPS
  // ============================================

  function abrirRota(posto: Posto) {
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

  // ============================================
  // LIGAR PARA UNIDADE
  // ============================================

  function ligar(telefone: string) {
    const telefoneLimpo =
      telefone.replace(/[^\d+]/g, '');

    window.location.href =
      `tel:${telefoneLimpo}`;
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 antialiased">
      {/* Glow de fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/10 via-[#00a884]/15 to-cyan-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 pb-20 sm:px-6 lg:px-8">

        {/* CABEÇALHO */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-[#00a884]">
            <Sparkles size={13} />
            <span>Rede de Atendimento</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Postos de Saúde e UBS
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Encontre Unidades Básicas de Saúde próximas
            utilizando sua localização atual.
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={usarMinhaLocalizacao}
              disabled={carregando}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00a884] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#009578] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Localizando...
                </>
              ) : localizacaoObtida ? (
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
        </div>

        {/* FONTE */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-cyan-400"
          />

          <div>
            <p className="text-sm font-semibold text-cyan-200">
              Dados de unidades de saúde
            </p>

            <p className="mt-0.5 text-xs leading-5 text-slate-400">
              As unidades são sincronizadas a partir
              dos dados do Ministério da Saúde / CNES.
              A distância é calculada utilizando sua
              localização atual.
            </p>
          </div>
        </div>

        {/* ERRO */}
        {erro && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div>
              <p className="text-sm font-semibold text-red-300">
                Não foi possível localizar os postos
              </p>

              <p className="mt-1 text-sm text-red-200/70">
                {erro}
              </p>
            </div>
          </div>
        )}

        {/* CARREGANDO */}
        {carregando && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2
              size={34}
              className="animate-spin text-[#00a884]"
            />

            <p className="mt-4 text-sm font-medium">
              Procurando unidades próximas...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Consultando unidades de saúde cadastradas.
            </p>
          </div>
        )}

        {/* ESTADO INICIAL */}
        {!carregando &&
          !localizacaoObtida &&
          !erro && (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
              <LocateFixed
                size={38}
                className="mx-auto text-slate-600"
              />

              <h2 className="mt-4 text-lg font-semibold text-slate-200">
                Encontre unidades próximas
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Clique em “Usar minha localização” e
                permita o acesso à localização do seu
                dispositivo.
              </p>
            </div>
          )}

        {/* RESULTADOS */}
        {!carregando &&
          localizacaoObtida &&
          postos.length > 0 && (
            <>
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-semibold text-white">
                    Unidades próximas
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {postos.length}{' '}
                    {postos.length === 1
                      ? 'unidade encontrada'
                      : 'unidades encontradas'}
                  </p>
                </div>

                {raioKm && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPinned size={14} />
                    Busca em até {raioKm} km
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {postos.map(
                  (posto, index) => (
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

                          {/* DISTÂNCIA */}
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-[#00a884]">
                              <Navigation size={12} />

                              {formatarDistancia(
                                posto.distanciaKm
                              )}{' '}
                              de você
                            </span>

                            {index === 0 && (
                              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                Mais próxima
                              </span>
                            )}
                          </div>

                          {/* NOME */}
                          <h2 className="text-xl font-bold tracking-tight text-white">
                            {posto.nome}
                          </h2>

                          {/* CLASSIFICAÇÃO */}
                          {(posto.classificacao ||
                            posto.tipo) && (
                            <p className="mt-1 text-xs text-slate-500">
                              {posto.classificacao ||
                                posto.tipo}
                            </p>
                          )}

                          {/* INFORMAÇÕES */}
                          <div className="mt-4 space-y-2.5">

                            {/* ENDEREÇO */}
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

                            {/* TELEFONE */}
                            {posto.telefone && (
                              <button
                                type="button"
                                onClick={() =>
                                  ligar(
                                    posto.telefone!
                                  )
                                }
                                className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-[#00a884]"
                              >
                                <Phone
                                  size={15}
                                  className="shrink-0 text-[#00a884]"
                                />

                                {posto.telefone}
                              </button>
                            )}

                            {/* CNES */}
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
                            Fonte: {posto.fonte}
                          </p>
                        </div>

                        {/* BOTÃO ROTA */}
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
                  )
                )}
              </div>
            </>
          )}

        {/* SEM RESULTADOS */}
        {!carregando &&
          localizacaoObtida &&
          postos.length === 0 &&
          !erro && (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <Building2
                size={34}
                className="mx-auto text-slate-600"
              />

              <p className="mt-3 text-sm font-medium text-slate-400">
                Nenhuma UBS foi encontrada próxima à
                sua localização.
              </p>

              {raioKm && (
                <p className="mt-2 text-xs text-slate-500">
                  Foram verificadas unidades em um raio
                  de até {raioKm} km.
                </p>
              )}

              <button
                type="button"
                onClick={usarMinhaLocalizacao}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#00a884] hover:underline"
              >
                <RefreshCw size={15} />
                Tentar novamente
              </button>
            </div>
          )}
      </div>
    </div>
  );
}