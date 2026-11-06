import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
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
  latitude: number | null;
  longitude: number | null;
  distanciaKm?: number | null;
  fonte?: string | null;
  municipio?: string | null;
  uf?: string | null;
  // Metadados retornados pela Edge Function buscar-postos-proximos.
  coordenadasSuspeitas?: boolean;
  unidadesMesmoPonto?: number;
  enderecosDistintosNoPonto?: number;
  usarEnderecoNoMapa?: boolean;
  enderecoParaBusca?: string | null;
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

const RAIO_MAXIMO_GPS_KM = 5;

type ModoBusca = 'localizacao' | 'manual' | null;



// Os rótulos representam o tipo de serviço, não a oferta confirmada de vacinação.
type Categoria = 'basica' | 'imunizacao' | 'urgencia' | 'hospital' | 'especializada' | 'outros';
type FiltroCategoria = 'todos' | Categoria;
type ClassificacaoVisual = { categoria: Categoria; rotulo: string };

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function classificarPosto(posto: Posto): ClassificacaoVisual {
  const nome = normalizar(posto.nome ?? '');
  const cadastro = normalizar([posto.tipo, posto.classificacao].filter(Boolean).join(' '));
  const conjunto = `${nome} ${cadastro}`;

  if (/\b(UPA|PRONTO ATENDIMENTO|PRONTO SOCORRO|UNIDADE DE PRONTO ATENDIMENTO)\b/.test(conjunto)) {
    return { categoria: 'urgencia', rotulo: 'Urgência e emergência' };
  }
  if (/\b(HOSPITAL|MATERNIDADE)\b/.test(conjunto)) {
    return { categoria: 'hospital', rotulo: 'Hospital público' };
  }
  if (/\b(UBS|ESF|USF|PSF|UNIDADE BASICA DE SAUDE|POSTO DE SAUDE|CENTRO DE SAUDE|SAUDE DA FAMILIA|ESTRATEGIA DE SAUDE DA FAMILIA|UNIDADE DE SAUDE DA FAMILIA)\b/.test(conjunto)) {
    return { categoria: 'basica', rotulo: 'Atenção básica' };
  }
  if (/\b(IMUNIZACAO|VACINACAO|CENTRO DE VACINAS|SALA DE VACINA)\b/.test(conjunto)) {
    return { categoria: 'imunizacao', rotulo: 'Imunização (confirmar oferta)' };
  }
  if (/\b(POLICLINICA|CAPS|CENTRO DE ESPECIALIDADES|CLINICA ESPECIALIZADA|AMBULATORIO|REABILITACAO|CENTRO DE ATENCAO PSICOSSOCIAL|ODONTOLOGIA|CEO)\b/.test(conjunto)) {
    return { categoria: 'especializada', rotulo: 'Atendimento especializado' };
  }
  return { categoria: 'outros', rotulo: 'Outro serviço público' };
}

function coordenadasValidas(posto: Posto): boolean {
  const lat = posto.latitude;
  const lon = posto.longitude;
  return typeof lat === 'number' && typeof lon === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 &&
    !(lat === 0 && lon === 0);
}

// A consulta manual não verifica coordenadas. Por segurança, abre o Maps
// pelo endereço; no GPS, só permite rota direta quando o backend informou
// explicitamente que não encontrou suspeita de duplicidade.
function usarBuscaPorEndereco(posto: Posto, modoBusca: ModoBusca): boolean {
  return modoBusca !== 'localizacao' ||
    !coordenadasValidas(posto) ||
    posto.coordenadasSuspeitas !== false ||
    posto.usarEnderecoNoMapa === true;
}

function consultaEnderecoMapa(posto: Posto): string {
  if (posto.enderecoParaBusca?.trim()) {
    return posto.enderecoParaBusca.trim();
  }
  return [
    posto.nome,
    posto.logradouro,
    posto.numero,
    posto.complemento,
    posto.municipio,
    posto.uf,
    posto.cep ? `CEP ${posto.cep}` : null,
    'Brasil',
  ].filter((valor) => typeof valor === 'string' && valor.trim()).join(', ');
}

// Distância aproximada em linha reta, usada para limitar e ordenar a busca por GPS.
function distanciaEmKm(latOrigem: number, lonOrigem: number, latDestino: number, lonDestino: number): number {
  const rad = (graus: number) => graus * Math.PI / 180;
  const dLat = rad(latDestino - latOrigem);
  const dLon = rad(lonDestino - lonOrigem);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(latOrigem)) * Math.cos(rad(latDestino)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Postos() {
  const [postos, setPostos] = useState<Posto[]>([]);
  const [temaClaro, setTemaClaro] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [buscaEmAndamento, setBuscaEmAndamento] = useState<'manual' | 'localizacao' | null>(null);
  const [erro, setErro] = useState('');
  const [modoBusca, setModoBusca] = useState<ModoBusca>(null);
  const [raioKm, setRaioKm] = useState<number | null>(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [termoPesquisado, setTermoPesquisado] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('todos');

  const classificados = useMemo(
    () => postos.map((posto) => ({ posto, info: classificarPosto(posto) })),
    [postos]
  );
  const filtrosDisponiveis = useMemo(() => {
    const categorias: { id: FiltroCategoria; nome: string; total: number }[] = [
      { id: 'todos', nome: 'Todos', total: classificados.length },
    ];
    const rotulos: Record<Categoria, string> = {
      basica: 'Atenção básica',
      imunizacao: 'Imunização',
      urgencia: 'Urgência',
      hospital: 'Hospitais',
      especializada: 'Especialidades',
      outros: 'Outros',
    };
    (Object.keys(rotulos) as Categoria[]).forEach((id) => {
      const total = classificados.filter((item) => item.info.categoria === id).length;
      if (total > 0) categorias.push({ id, nome: rotulos[id], total });
    });
    return categorias;
  }, [classificados]);
  const exibidos = classificados.filter(
    (item) => filtroCategoria === 'todos' || item.info.categoria === filtroCategoria
  );

  useEffect(() => {
    const sincronizarTema = () => setTemaClaro(Boolean(document.querySelector('.easyvacc-light')));
    sincronizarTema();
    const observer = new MutationObserver(sincronizarTema);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  function formatarDistancia(distanciaKm?: number | null) {
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
              limite: 30,
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

      // O backend ainda pode consultar um raio maior; a tela exibe somente até 5 km.
      const proximos = (data.postos ?? [])
        .filter(coordenadasValidas)
        .map((posto) => ({
          ...posto,
          distanciaKm: distanciaEmKm(latitude, longitude, posto.latitude!, posto.longitude!),
        }))
        .filter((posto) => posto.distanciaKm <= RAIO_MAXIMO_GPS_KM)
        .sort((a, b) => a.distanciaKm - b.distanciaKm);
      setPostos(proximos);
      setFiltroCategoria('todos');
      setRaioKm(RAIO_MAXIMO_GPS_KM);
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
      setBuscaEmAndamento(null);
    }
  }

  function usarMinhaLocalizacao() {
    setErro('');
    setCarregando(true);
    setBuscaEmAndamento('localizacao');

    if (!navigator.geolocation) {
      setErro(
        'Seu navegador não oferece suporte à localização. Você pode pesquisar manualmente por CEP, cidade, bairro ou unidade.'
      );

      setCarregando(false);
      setBuscaEmAndamento(null);
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
        setBuscaEmAndamento(null);
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
    setBuscaEmAndamento('manual');

    try {
      const { data, error } = await supabase.rpc(
        'buscar_postos_manual',
        {
          termo_busca: termo,
          limite_resultados: 50,
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
      setFiltroCategoria('todos');
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
      setBuscaEmAndamento(null);
    }
  }

  function limparBuscaManual() {
    setTermoBusca('');
    setTermoPesquisado('');
    setPostos([]);
    setRaioKm(null);
    setModoBusca(null);
    setFiltroCategoria('todos');
    setErro('');
  }

  function abrirRota(posto: Posto) {
    const buscarEndereco = usarBuscaPorEndereco(posto, modoBusca);
    const url = buscarEndereco
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consultaEnderecoMapa(posto))}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${posto.latitude},${posto.longitude}`)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function ligar(telefone: string) {
    const telefoneLimpo =
      telefone.replace(/[^\d+]/g, '');

    window.location.href =
      `tel:${telefoneLimpo}`;
  }

  return (
    <div className="ev-page relative min-h-screen w-full bg-transparent text-slate-100 antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-600/10 via-[#126ca8]/15 to-blue-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
        <div className="ev-card ev-page-header mb-6 rounded-2xl border border-slate-800 bg-[#081629]/80 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-blue-600/30 bg-blue-600/10 px-3 py-1 text-xs font-medium text-[#126ca8]">
            <Sparkles size={13} />
            <span>
              Rede de Atendimento
            </span>
          </div>

          <h1 className="ev-page-title text-3xl font-bold tracking-tight text-white">
            Encontre unidades de saúde
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Encontre unidades de saúde usando sua localização
            atual ou pesquise manualmente por CEP, cidade,
            bairro, logradouro ou nome da unidade.
          </p>

          <label htmlFor="busca-posto" className="mt-6 mb-2 block text-xs font-semibold text-slate-300">
            Pesquisar por CEP, cidade, bairro ou unidade
          </label>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) =>
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
                  id="busca-posto"
                  type="search"
                  value={termoBusca}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setTermoBusca(
                      event.target.value
                    )
                  }
                  disabled={carregando}
                  placeholder="CEP, cidade, bairro ou unidade"
                  aria-label="Buscar posto de saúde"
                  className="min-h-12 w-full rounded-xl border border-slate-700 bg-[#020817]/80 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="ev-btn-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando && buscaEmAndamento === 'manual' ? (
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
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${temaClaro ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-blue-500/40 bg-blue-500/15 text-blue-200 hover:bg-blue-500/25'}`}
            >
              {carregando && buscaEmAndamento === 'localizacao' ? (
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
            A busca manual não exige acesso à localização do dispositivo.
            Os resultados dependem da cobertura e qualidade do cadastro disponível.
          </p>
        </div>

        <div className={`ev-card relative z-10 mb-6 flex items-start gap-3 rounded-2xl border p-4 shadow-sm sm:p-5 ${
          temaClaro
            ? 'border-slate-200 bg-white text-slate-900'
            : 'border-slate-700 bg-[#081629] text-slate-100'
        }`}>
          <ShieldCheck
            size={20}
            className={`mt-0.5 shrink-0 ${temaClaro ? 'text-blue-700' : 'text-blue-400'}`}
          />
          <div className="min-w-0">
            <p className={`text-sm font-bold ${temaClaro ? 'text-slate-900' : 'text-white'}`}>
              Sobre os dados das unidades
            </p>
            <p className={`mt-1 text-xs leading-6 sm:text-sm ${temaClaro ? 'text-slate-700' : 'text-slate-300'}`}>
              As unidades são consultadas a partir de cadastros do Ministério da Saúde (CNES).
              Antes de visitar, confirme o endereço, o horário de funcionamento e a disponibilidade do atendimento desejado.
              O cadastro não garante que a unidade esteja aberta ou ofereça vacinação.
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
              className="animate-spin text-[#126ca8]"
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
            <div className="ev-empty-state rounded-2xl border border-dashed border-slate-800 bg-[#081629]/30 p-10 text-center sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-[#081629] text-slate-500">
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
          classificados.length > 0 && (
            <>
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="ev-section-title font-semibold text-white">
                    {modoBusca === 'localizacao'
                      ? 'Unidades próximas'
                      : 'Resultado da busca'}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {classificados.length}{' '}
                    {classificados.length === 1
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
                  {modoBusca === 'manual' && postos.length >= 50 && (
                    <p className="mt-1 text-xs text-amber-300/90">
                      A pesquisa manual atingiu o limite de resultados. Pode haver outras unidades cadastradas.
                    </p>
                  )}
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
                      className="rounded-lg px-3 py-2 text-xs font-extrabold text-blue-600 transition hover:bg-blue-600/10"
                    >
                      Limpar busca
                    </button>
                  )}
                </div>
              </div>

                             {filtrosDisponiveis.length > 2 && (
                 <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar resultados por tipo de serviço">
                   {filtrosDisponiveis.map((filtro) => (
                     <button
                       key={filtro.id}
                       type="button"
                       onClick={() => setFiltroCategoria(filtro.id)}
                       aria-pressed={filtroCategoria === filtro.id}
                       className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                         filtroCategoria === filtro.id
                           ? 'bg-blue-600 text-white shadow-sm'
                           : temaClaro
                             ? 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                             : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                       }`}
                     >
                       {filtro.nome} ({filtro.total})
                     </button>
                   ))}
                 </div>
               )}

<p className="mb-4 text-xs leading-5 text-slate-500">
                Antes de visitar uma unidade, confirme o funcionamento, o endereço, o horário e se ela oferece o atendimento desejado. Cadastro no CNES não confirma vacinação.
                {modoBusca === 'manual' && ' Nesta pesquisa, o mapa é aberto pelo endereço cadastrado.'}
              </p>

              {exibidos.length === 0 && (
                <p className="mb-4 rounded-xl border border-slate-800 p-5 text-sm text-slate-400">
                  Nenhum resultado desta consulta corresponde ao filtro escolhido.
                  Selecione “Todos” para visualizar as unidades encontradas.
                </p>
              )}

              <div className="space-y-4">
                {exibidos.map(
                  ({ posto, info }) => {
                    const buscarEndereco = usarBuscaPorEndereco(posto, modoBusca);
                    const rotaDireta = !buscarEndereco;
                    const distancia = rotaDireta ? formatarDistancia(posto.distanciaKm) : null;
                    const localizacaoSuspeita = modoBusca === 'localizacao' &&
                      (posto.coordenadasSuspeitas === true || posto.usarEnderecoNoMapa === true);
                    const localizacaoNaoAvaliada = modoBusca === 'localizacao' &&
                      posto.coordenadasSuspeitas == null;

                    return (
                      <div
                        key={
                          posto.cnes || posto.id
                        }
                        className="ev-card rounded-2xl border border-slate-800 bg-[#081629]/60 p-6 shadow-xl backdrop-blur-md transition-all hover:border-slate-700 md:p-7"
                      >
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-200">
                                {info.rotulo}
                              </span>

                              {modoBusca === 'localizacao' &&
                                distancia && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-600/30 bg-blue-600/10 px-3 py-1 text-xs font-semibold text-[#126ca8]">
                                    <Navigation
                                      size={12}
                                    />
                                    {distancia} (estimativa)
                                  </span>
                                )}

                              {localizacaoSuspeita && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                                  <AlertCircle size={12} />
                                  Localização a confirmar
                                </span>
                              )}

                              {localizacaoNaoAvaliada && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                                  <AlertCircle size={12} />
                                  Localização não verificada
                                </span>
                              )}

                              {modoBusca === 'manual' &&
                                posto.municipio && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-600/30 bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-300">
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

                            <div className="mt-4 space-y-2.5">
                              <p className="flex items-start gap-2 text-sm text-slate-300">
                                <MapPin
                                  size={16}
                                  className="mt-0.5 shrink-0 text-[#126ca8]"
                                />

                                <span>
                                  {montarEndereco(
                                    posto
                                  )}
                                </span>
                              </p>

                              {localizacaoSuspeita && (
                                <p className="flex items-start gap-2 text-xs leading-5 text-amber-200/90">
                                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                  As coordenadas cadastradas podem estar incorretas. O mapa será aberto pelo endereço informado; confirme o local antes de sair.
                                </p>
                              )}

                              {localizacaoNaoAvaliada && (
                                <p className="text-xs leading-5 text-amber-200/90">
                                  Não foi possível verificar as coordenadas. Consulte o endereço no mapa antes de visitar.
                                </p>
                              )}

                              {posto.telefone && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    ligar(
                                      posto.telefone!
                                    )
                                  }
                                  className="flex items-center gap-2 text-left text-sm text-slate-300 transition hover:text-[#126ca8]"
                                >
                                  <Phone
                                    size={15}
                                    className="shrink-0 text-[#126ca8]"
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
                              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-extrabold transition md:w-auto ${temaClaro ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-blue-500/40 bg-blue-500/15 text-blue-200 hover:bg-blue-500/25'}`}
                            >
                              <Navigation
                                size={17}
                              />
                              {rotaDireta ? 'Como chegar' : 'Ver no mapa'}
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
          classificados.length === 0 &&
          !erro && (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <Building2
                size={34}
                className="mx-auto text-slate-600"
              />

              <p className="mt-3 text-sm font-medium text-slate-400">
                {modoBusca === 'manual'
                  ? 'Nenhuma unidade pública de saúde foi encontrada nesta busca.'
                  : 'Nenhuma unidade pública de saúde foi encontrada em até 5 km da sua localização.'}
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
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <RefreshCw size={15} />
                  Fazer outra busca
                </button>
              ) : (
                <button
                  type="button"
                  onClick={usarMinhaLocalizacao}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700"
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