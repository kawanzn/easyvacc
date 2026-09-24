import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronRight,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  Syringe,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { supabase } from '../services/supabase';
import {
  lerPessoaAtiva,
  salvarPessoaAtiva,
  type PessoaAtiva,
} from '../lib/brasil';

type Situacao = {
  pessoa: {
    tipo: string;
    id: string | number;
    nome: string;
  };

  origemDados: string;
  origemRotulo: string;
  sincronizadoEm: string | null;

  totalRegistros: number;

  atrasadas: {
    id: number;
    nome: string;
    proximaDose: string;
  }[];

  proximaDose: {
    nome: string;
    data: string;
  } | null;

  campanhasAplicaveis: {
    id: number;
    titulo: string;
    status: string;
  }[];

  coberturaPercentual: number | null;
  coberturaDisponivel: boolean;

  status: string;
  statusRotulo: string;
  statusDetalhe: string;

  regra: string;
};

type VacinaBanco = {
  id: number;
  nome?: string | null;
  vacina?: string | null;
  nome_vacina?: string | null;
  data_aplicacao?: string | null;
  data?: string | null;
  proxima_dose?: string | null;
  proximaDose?: string | null;
};

type CampanhaBanco = {
  id: number;
  titulo: string;
  status?: string | null;
};

function formatarSincronizacao(iso: string | null) {
  if (!iso) {
    return 'Ainda não houve sincronização';
  }

  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) {
    return 'Data indisponível';
  }

  return data.toLocaleString('pt-BR');
}

function formatarData(data?: string | null) {
  if (!data) return '';

  const valor = new Date(`${data.substring(0, 10)}T12:00:00`);

  if (Number.isNaN(valor.getTime())) {
    return data;
  }

  return valor.toLocaleDateString('pt-BR');
}

function nomeVacina(vacina: VacinaBanco) {
  return (
    vacina.nome ||
    vacina.nome_vacina ||
    vacina.vacina ||
    'Vacina'
  );
}

export default function Dashboard() {
  const [situacao, setSituacao] =
    useState<Situacao | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  const [pessoa, setPessoa] =
    useState<PessoaAtiva | null>(null);

useEffect(() => {
  let ativo = true;

  const carregarDashboard = async () => {
    if (!ativo) return;

    setCarregando(true);
    setErro('');

    try {
      // ==========================================
      // 1. USUÁRIO AUTENTICADO
      // ==========================================

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          'Faça login para ver a caderneta.'
        );
      }

      // ==========================================
      // 2. PERFIL DO TITULAR
      // ==========================================

      const {
        data: perfil,
        error: perfilError,
      } = await supabase
        .from('users')
        .select(
          'id, nome, data_nascimento, updated_at'
        )
        .eq('id', user.id)
        .single();

      if (perfilError) {
        throw perfilError;
      }

      // ==========================================
      // 3. PESSOA ATIVA
      // ==========================================

      const pessoaSalva = lerPessoaAtiva();

      let pessoaAtual: PessoaAtiva;
      let pessoaId: string | number;
      let tipoPessoa: 'titular' | 'dependente';

      if (
        pessoaSalva &&
        pessoaSalva.tipo === 'dependente'
      ) {
        pessoaAtual = pessoaSalva;
        pessoaId = pessoaSalva.id;
        tipoPessoa = 'dependente';
      } else {
        const titular: PessoaAtiva = {
          tipo: 'titular',
          id: perfil.id,
          nome: perfil.nome,
        };

        salvarPessoaAtiva(titular);

        pessoaAtual = titular;
        pessoaId = perfil.id;
        tipoPessoa = 'titular';
      }

      if (!ativo) return;

      setPessoa(pessoaAtual);

      // ==========================================
      // 4. VACINAS
      // ==========================================

      let queryVacinas = supabase
        .from('vacinas')
        .select('*');

      if (tipoPessoa === 'dependente') {
        queryVacinas = queryVacinas.eq(
          'dependente_id',
          pessoaId
        );
      } else {
        queryVacinas = queryVacinas.eq(
          'usuario_id',
          user.id
        );
      }

      const {
        data: vacinasData,
        error: vacinasError,
      } = await queryVacinas;

      if (vacinasError) {
        console.error(
          'Erro ao buscar vacinas:',
          vacinasError
        );

        throw vacinasError;
      }

      const vacinas =
        (vacinasData ?? []) as VacinaBanco[];

      // ==========================================
      // 5. CAMPANHAS
      // ==========================================

      const {
        data: campanhasData,
        error: campanhasError,
      } = await supabase
        .from('campanhas')
        .select('*');

      if (campanhasError) {
        console.error(
          'Erro ao buscar campanhas:',
          campanhasError
        );
      }

      const campanhas =
        (campanhasData ?? []) as CampanhaBanco[];

      // ==========================================
      // 6. VACINAS ATRASADAS
      // ==========================================

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const atrasadas = vacinas
        .filter((vacina) => {
          const proxima =
            vacina.proxima_dose ||
            vacina.proximaDose;

          if (!proxima) {
            return false;
          }

          const dataProxima = new Date(
            `${proxima.substring(0, 10)}T12:00:00`
          );

          return dataProxima < hoje;
        })
        .map((vacina) => ({
          id: vacina.id,
          nome: nomeVacina(vacina),

          proximaDose: formatarData(
            vacina.proxima_dose ||
              vacina.proximaDose
          ),
        }));

      // ==========================================
      // 7. PRÓXIMA DOSE
      // ==========================================

      const futuras = vacinas
        .filter((vacina) => {
          const proxima =
            vacina.proxima_dose ||
            vacina.proximaDose;

          if (!proxima) {
            return false;
          }

          const dataProxima = new Date(
            `${proxima.substring(0, 10)}T12:00:00`
          );

          return dataProxima >= hoje;
        })
        .sort((a, b) => {
          const dataA =
            a.proxima_dose ||
            a.proximaDose ||
            '';

          const dataB =
            b.proxima_dose ||
            b.proximaDose ||
            '';

          return (
            new Date(dataA).getTime() -
            new Date(dataB).getTime()
          );
        });

      const primeiraFutura = futuras[0];

      const proximaDose = primeiraFutura
        ? {
            nome: nomeVacina(primeiraFutura),

            data: formatarData(
              primeiraFutura.proxima_dose ||
                primeiraFutura.proximaDose
            ),
          }
        : null;

      // ==========================================
      // 8. COBERTURA
      // ==========================================

      const coberturaDisponivel = false;
      const coberturaPercentual = null;

      // ==========================================
      // 9. STATUS
      // ==========================================

      let status = 'sem_dados';
      let statusRotulo = 'Sem dados';

      let statusDetalhe =
        'Ainda não existem registros de vacinação cadastrados para esta pessoa.';

      if (vacinas.length > 0) {
        if (atrasadas.length > 0) {
          status = 'atrasada';

          statusRotulo =
            'Possui retorno pendente';

          statusDetalhe =
            'Existem vacinas com próxima dose cadastrada em data anterior à data atual.';
        } else {
          status = 'em_dia';

          statusRotulo =
            'Sem retornos atrasados';

          statusDetalhe =
            'Não foram encontrados retornos de vacinação vencidos nos registros cadastrados.';
        }
      }

      // ==========================================
      // 10. CAMPANHAS
      // ==========================================

      const campanhasAplicaveis =
        campanhas.map((campanha) => ({
          id: campanha.id,
          titulo: campanha.titulo,
          status:
            campanha.status || 'Ativa',
        }));

      // ==========================================
      // 11. MONTAR SITUAÇÃO
      // ==========================================

      const resultado: Situacao = {
        pessoa: {
          tipo: tipoPessoa,
          id: pessoaId,
          nome: pessoaAtual.nome,
        },

        origemDados: 'supabase',

        origemRotulo:
          'Dados cadastrados no EasyVacc',

        sincronizadoEm:
          perfil.updated_at ||
          new Date().toISOString(),

        totalRegistros: vacinas.length,

        atrasadas,

        proximaDose,

        campanhasAplicaveis,

        coberturaPercentual,

        coberturaDisponivel,

        status,

        statusRotulo,

        statusDetalhe,

        regra: 'retornos_cadastrados',
      };

      if (!ativo) return;

      setSituacao(resultado);
    } catch (error) {
      console.error(
        'Erro ao carregar Dashboard:',
        error
      );

      if (ativo) {
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o Dashboard.'
        );
      }
    } finally {
      if (ativo) {
        setCarregando(false);
      }
    }
  };

  // ==========================================
  // PRIMEIRO CARREGAMENTO
  // ==========================================

  void carregarDashboard();

  // ==========================================
  // TROCA TITULAR / DEPENDENTE
  // ==========================================

  const handlePessoaAtivaAtualizada = () => {
    console.log(
      'Pessoa ativa mudou:',
      lerPessoaAtiva()
    );

    void carregarDashboard();
  };

  window.addEventListener(
    'pessoaAtivaAtualizada',
    handlePessoaAtivaAtualizada
  );

  // ==========================================
  // LIMPEZA
  // ==========================================

  return () => {
    ativo = false;

    window.removeEventListener(
      'pessoaAtivaAtualizada',
      handlePessoaAtivaAtualizada
    );
  };
}, []);

  // ==========================================
  // STATUS
  // ==========================================

  const tomStatus = useMemo(() => {
    const status = situacao?.status;

    if (status === 'em_dia') {
      return 'emerald';
    }

    if (status === 'atrasada') {
      return 'amber';
    }

    return 'slate';
  }, [situacao]);

  const coberturaTexto =
    situacao?.coberturaDisponivel
      ? `${situacao.coberturaPercentual}%`
      : 'Indisponível';

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">

        {/* ===================================== */}
        {/* CABEÇALHO */}
        {/* ===================================== */}

        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-800 pb-7 lg:flex-row lg:items-end">

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">

              <span>EasyVacc</span>

              <ChevronRight size={13} />

              <span className="text-slate-200">
                Visão geral
              </span>

            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white md:text-[34px]">
              Visão geral
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Indicadores calculados com os registros
              cadastrados no EasyVacc.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <Link
              to="/notificacoes"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300"
              title="Notificações"
            >
              <Bell size={18} />
            </Link>

            <Link
              to="/perfil"
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <User size={16} />
              </div>

              <div className="hidden text-left sm:block">

                <p className="text-xs font-semibold text-slate-200">
                  {pessoa?.nome ||
                    'Minha conta'}
                </p>

                <p className="text-[10px] text-slate-400">
                  {pessoa?.tipo ===
                  'dependente'
                    ? 'Dependente'
                    : 'Titular'}
                </p>

              </div>
            </Link>

          </div>
        </header>

        {/* ===================================== */}
        {/* CARREGANDO */}
        {/* ===================================== */}

        {carregando && (
          <div className="flex items-center gap-3 text-slate-300">

            <Loader2
              className="animate-spin text-[#00a884]"
            />

            Carregando situação vacinal...

          </div>
        )}

        {/* ===================================== */}
        {/* ERRO */}
        {/* ===================================== */}

        {erro && !carregando && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {erro}
          </div>
        )}

        {/* ===================================== */}
        {/* DASHBOARD */}
        {/* ===================================== */}

        {situacao && !carregando && (
          <>

            <section className="mb-7 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

              <div className="grid lg:grid-cols-[1fr_340px]">

                <div className="p-6 md:p-8">

                  <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-200">

                    Consultando:{' '}

                    {pessoa?.tipo ===
                    'dependente'
                      ? 'dependente'
                      : 'titular'}

                    {' — '}

                    {pessoa?.nome ||
                      situacao.pessoa.nome}

                  </div>

                  <p className="text-sm font-medium text-slate-400">
                    Caderneta de
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">

                    {pessoa?.nome ||
                      situacao.pessoa.nome}

                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">

                    {situacao.statusDetalhe}

                  </p>

                  <p className="mt-3 text-xs leading-5 text-slate-400">

                    Última sincronização:{' '}

                    {formatarSincronizacao(
                      situacao.sincronizadoEm
                    )}

                    {' · '}

                    {situacao.origemRotulo}

                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">

                    <Link
                      to="/historico"
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      <Syringe size={16} />

                      Consultar vacinas
                    </Link>

                    <Link
                      to="/certificado"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white"
                    >
                      <FileText size={16} />

                      Emitir certificado
                    </Link>

                  </div>

                </div>

                <div className="border-t border-slate-800 bg-slate-950/40 p-6 md:p-8 lg:border-l lg:border-t-0">

                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Situação vacinal
                  </p>

                  <div className="mt-5 flex items-center gap-4">

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-lg border ${
                        tomStatus ===
                        'emerald'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          : tomStatus ===
                              'amber'
                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                            : 'border-slate-700 bg-slate-800 text-slate-300'
                      }`}
                    >

                      {tomStatus === 'amber'
                        ? (
                          <AlertTriangle
                            size={22}
                          />
                        )
                        : (
                          <ShieldCheck
                            size={22}
                          />
                        )}

                    </div>

                    <div>

                      <p className="text-lg font-bold text-white">
                        {situacao.statusRotulo}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">

                        Regra:{' '}

                        {situacao.regra.replaceAll(
                          '_',
                          ' '
                        )}

                      </p>

                    </div>

                  </div>

                  <div className="my-6 h-px bg-slate-800" />

                  <div>

                    <p className="text-xs font-medium text-slate-400">
                      Cobertura calculada
                    </p>

                    <p className="mt-1 text-3xl font-bold tracking-tight text-white">
                      {coberturaTexto}
                    </p>

                    {!situacao.coberturaDisponivel && (
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        Ainda não há dados suficientes
                        para calcular um percentual.
                      </p>
                    )}

                  </div>

                  {situacao.coberturaDisponivel && (
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${situacao.coberturaPercentual}%`,
                        }}
                      />

                    </div>
                  )}

                </div>

              </div>

            </section>

            {/* ================================= */}
            {/* INDICADORES */}
            {/* ================================= */}

            <section className="mb-8">

              <h2 className="text-base font-semibold text-white">
                Pendências e campanhas
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Informações calculadas diretamente
                dos registros no Supabase.
              </p>

              <div className="mt-4 grid grid-cols-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 md:grid-cols-3">

                <div className="border-b border-slate-800 p-5 md:border-b-0 md:border-r">

                  <p className="text-xs font-medium text-slate-400">
                    Registros cadastrados
                  </p>

                  <p className="mt-1 text-xl font-bold text-white">
                    {situacao.totalRegistros}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">

                    {situacao.totalRegistros === 0
                      ? 'Nenhuma dose na base'
                      : 'Doses encontradas neste perfil'}

                  </p>

                </div>

                <div className="border-b border-slate-800 p-5 md:border-b-0 md:border-r">

                  <p className="text-xs font-medium text-slate-400">
                    Vacinas atrasadas
                  </p>

                  <p className="mt-1 text-xl font-bold text-white">
                    {situacao.atrasadas.length}
                  </p>

                  {situacao.atrasadas[0] && (
                    <p className="mt-1 text-[11px] text-amber-300">

                      {
                        situacao.atrasadas[0]
                          .nome
                      }

                      {' · retorno '}

                      {
                        situacao.atrasadas[0]
                          .proximaDose
                      }

                    </p>
                  )}

                </div>

                <div className="p-5">

                  <p className="text-xs font-medium text-slate-400">
                    Próxima dose
                  </p>

                  <p className="mt-1 text-base font-bold text-white">

                    {situacao.proximaDose
                      ? `${situacao.proximaDose.nome} em ${situacao.proximaDose.data}`
                      : 'Nenhum retorno futuro cadastrado'}

                  </p>

                </div>

              </div>

            </section>

            {/* ================================= */}
            {/* CAMPANHAS */}
            {/* ================================= */}

            {situacao.campanhasAplicaveis
              .length > 0 && (
              <section className="mb-8 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">

                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">

                  <CalendarDays size={16} />

                  Campanhas disponíveis

                </div>

                <ul className="mt-3 space-y-1 text-sm text-slate-200">

                  {situacao.campanhasAplicaveis.map(
                    (campanha) => (
                      <li key={campanha.id}>

                        {campanha.titulo}

                        {' — '}

                        {campanha.status}

                      </li>
                    )
                  )}

                </ul>

                <Link
                  to="/campanhas"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300"
                >
                  Ver campanhas

                  <ArrowRight size={14} />
                </Link>

              </section>
            )}

            {/* ================================= */}
            {/* SERVIÇOS */}
            {/* ================================= */}

            <section className="mb-8">

              <h2 className="text-base font-semibold text-white">
                Serviços
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                {[
                  {
                    to: '/historico',
                    icon: Syringe,
                    titulo:
                      'Histórico de vacinação',
                    descricao:
                      'Aplicações, lotes e próximas doses.',
                  },
                  {
                    to: '/certificado',
                    icon: FileText,
                    titulo: 'Certificado',
                    descricao:
                      'Comprovante com os registros desta base.',
                  },
                  {
                    to: '/postos',
                    icon: MapPin,
                    titulo:
                      'Postos de saúde',
                    descricao:
                      'Unidades cadastradas na plataforma.',
                  },
                  {
                    to: '/perfil',
                    icon: User,
                    titulo:
                      'Dados pessoais',
                    descricao:
                      'Consulte e atualize seus dados.',
                  },
                ].map((servico) => (
                  <Link
                    key={servico.to}
                    to={servico.to}
                    className="group rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700"
                  >

                    <servico.icon
                      className="mb-4 text-slate-300"
                      size={19}
                    />

                    <h3 className="text-sm font-semibold text-white">
                      {servico.titulo}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {servico.descricao}
                    </p>

                  </Link>
                ))}

              </div>

            </section>

            {/* ================================= */}
            {/* DEPENDENTES */}
            {/* ================================= */}

            <section className="flex flex-col justify-between gap-5 rounded-xl border border-slate-800 bg-slate-900 p-5 md:flex-row md:items-center">

              <div>

                <h2 className="text-sm font-semibold text-white">
                  Dependentes
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Gerencie as pessoas vinculadas à
                  sua conta.
                </p>

              </div>

              <Link
                to="/dependentes"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300"
              >
                Gerenciar dependentes

                <ArrowRight size={14} />
              </Link>

            </section>

          </>
        )}

      </div>
    </div>
  );
}