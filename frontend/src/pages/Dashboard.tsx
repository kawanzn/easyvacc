import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  MapPin,
  Megaphone,
  ShieldCheck,
  Sparkles,
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
};
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
  const [temaClaro, setTemaClaro] = useState(() => {
    return localStorage.getItem('easyvacc-tema') === 'claro';
  });

  useEffect(() => {
    const atualizarTema = () => {
      setTemaClaro(localStorage.getItem('easyvacc-tema') === 'claro');
    };

    atualizarTema();

    window.addEventListener('storage', atualizarTema);
    window.addEventListener('easyvaccTemaAtualizado', atualizarTema);

    const observador = new MutationObserver(atualizarTema);

    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    observador.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    const intervalo = window.setInterval(atualizarTema, 200);

    return () => {
      window.removeEventListener('storage', atualizarTema);
      window.removeEventListener('easyvaccTemaAtualizado', atualizarTema);
      observador.disconnect();
      window.clearInterval(intervalo);
    };
  }, []);

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
          'id, nome, data_nascimento'
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
        .select('id, nome, data_aplicacao, lote, fabricante, proxima_dose, posto, profissional')
        .eq('usuario_id', user.id)
        .in('status', ['ativo', 'corrigido']);
      if (tipoPessoa === 'dependente') {
        queryVacinas = queryVacinas.eq('dependente_id', Number(pessoaId));
      } else {
        queryVacinas = queryVacinas.is('dependente_id', null);
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
        .select('id, titulo')
        .eq('ativa', true)
        .order('destaque', { ascending: false });
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
          status: 'Ativa',
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
        totalRegistros: vacinas.length,
        atrasadas,
        proximaDose,
        campanhasAplicaveis,
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
  return (
    <div
      className={`min-h-full bg-slate-950 text-slate-100 transition-colors duration-300 ${
        temaClaro ? 'easyvacc-light' : ''
      }`}
    >
      <style>{`
        .easyvacc-light {
          background: #f8fafc !important;
          color: #0f172a !important;
        }

        .easyvacc-light .ev-surface {
          background: #ffffff !important;
          border-color: #dbe3ee !important;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06) !important;
        }

        .easyvacc-light .ev-title {
          color: #0f172a !important;
        }

        .easyvacc-light .ev-text {
          color: #334155 !important;
        }

        .easyvacc-light .ev-muted {
          color: #64748b !important;
        }

        .easyvacc-light .ev-green {
          color: #047857 !important;
        }

        .easyvacc-light .ev-hero {
          background:
            radial-gradient(circle at 88% 18%, rgba(16, 185, 129, 0.12), transparent 30%),
            linear-gradient(135deg, #ffffff 0%, #f8fafc 58%, #ecfdf5 100%) !important;
          border-color: #cbd5e1 !important;
        }

        .easyvacc-light .ev-status {
          background: #ecfdf5 !important;
          border-color: #bbf7d0 !important;
        }

        .easyvacc-light .ev-status-warn {
          background: #fffbeb !important;
          border-color: #fde68a !important;
        }

        .easyvacc-light .ev-secondary {
          background: #ffffff !important;
          color: #334155 !important;
          border-color: #cbd5e1 !important;
        }

        .easyvacc-light .ev-badge {
          background: #5b6474 !important;
          color: #ffffff !important;
        }

        .easyvacc-light .ev-campaign {
          background: linear-gradient(135deg, #ecfeff 0%, #f0fdf4 100%) !important;
          border-color: #a5f3fc !important;
        }

        .easyvacc-light .ev-service:hover {
          background: #f0fdf4 !important;
          border-color: #a7f3d0 !important;
        }
      `}</style>

      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_36%)]" />

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 md:px-10 md:py-10">
          <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-400 ev-green">
                <Sparkles size={15} />
                <span>Minha saúde</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white ev-title md:text-4xl">
                Olá, {pessoa?.nome?.split(' ')[0] || 'usuário'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 ev-muted">
                Aqui está um resumo dos registros de vacinação e próximos cuidados cadastrados no EasyVacc.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/notificacoes"
                aria-label="Notificações"
                title="Notificações"
                className="ev-surface flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 shadow-lg transition hover:-translate-y-0.5 hover:border-emerald-500/30"
              >
                <Bell size={18} aria-hidden="true" />
              </Link>

              <Link
                to="/perfil"
                className="ev-surface flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 shadow-lg transition hover:-translate-y-0.5 hover:border-emerald-500/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ev-green">
                  <User size={16} />
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold text-slate-100 ev-title">
                    {pessoa?.nome || 'Minha conta'}
                  </p>
                  <p className="text-[10px] text-slate-500 ev-muted">
                    {pessoa?.tipo === 'dependente' ? 'Dependente' : 'Titular'}
                  </p>
                </div>
              </Link>
            </div>
          </header>

          {carregando && (
            <div role="status" aria-live="polite" className="space-y-5">
              <span className="sr-only">Carregando registros...</span>
              <div className="ev-surface h-72 animate-pulse rounded-[28px] border border-slate-800 bg-slate-900" />
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="ev-surface h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
                  />
                ))}
              </div>
            </div>
          )}

          {erro && !carregando && (
            <div
              role="alert"
              className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
            >
              {erro}
            </div>
          )}

          {situacao && !carregando && (
            <>
              <section className="ev-hero ev-surface relative mb-6 overflow-hidden rounded-[30px] border border-slate-800 bg-[radial-gradient(circle_at_88%_18%,rgba(16,185,129,0.16),transparent_28%),linear-gradient(135deg,#0f172a_0%,#111827_55%,#052e2b_100%)] shadow-2xl">
                <div className="grid lg:grid-cols-[1fr_390px]">
                  <div className="relative p-6 sm:p-8 lg:p-10">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 ev-green">
                      <User size={14} />
                      {pessoa?.tipo === 'dependente'
                        ? 'Caderneta do dependente'
                        : 'Minha caderneta'}
                    </div>

                    <p className="text-sm font-medium text-slate-400 ev-muted">
                      Registros de
                    </p>
                    <h2 className="mt-1 text-3xl font-black tracking-tight text-white ev-title sm:text-4xl">
                      {pessoa?.nome || situacao.pessoa.nome}
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 ev-text">
                      {situacao.statusDetalhe}
                    </p>
                    <p className="mt-3 text-xs text-slate-500 ev-muted">
                      Fonte dos registros: {situacao.origemRotulo}
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link
                        to="/historico"
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-500"
                      >
                        <Syringe size={16} />
                        Ver carteira
                        <ArrowRight size={15} />
                      </Link>

                      <Link
                        to="/certificado"
                        className="ev-secondary inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/30 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:-translate-y-0.5 hover:border-slate-500"
                      >
                        <FileText size={16} />
                        Certificado
                      </Link>
                    </div>
                  </div>

                  <div
                    className={`${
                      tomStatus === 'amber' ? 'ev-status-warn' : 'ev-status'
                    } border-t border-slate-800 bg-slate-950/35 p-6 sm:p-8 lg:border-l lg:border-t-0`}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 ev-muted">
                          Situação dos registros
                        </p>

                        <div className="mt-5 flex items-start gap-4">
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
                              tomStatus === 'emerald'
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : tomStatus === 'amber'
                                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                                  : 'border-slate-700 bg-slate-800 text-slate-300'
                            }`}
                          >
                            {tomStatus === 'amber' ? (
                              <AlertTriangle size={25} />
                            ) : tomStatus === 'emerald' ? (
                              <CheckCircle2 size={25} />
                            ) : (
                              <ShieldCheck size={25} />
                            )}
                          </div>

                          <div>
                            <p className="text-xl font-extrabold text-white ev-title">
                              {situacao.statusRotulo}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-400 ev-muted">
                              {situacao.totalRegistros === 0
                                ? 'Não há registros para avaliar retornos.'
                                : situacao.atrasadas.length > 0
                                  ? `${situacao.atrasadas.length} ${
                                      situacao.atrasadas.length === 1
                                        ? 'retorno cadastrado está vencido.'
                                        : 'retornos cadastrados estão vencidos.'
                                    }`
                                  : 'Não há próxima dose vencida entre os registros cadastrados.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-7 border-t border-slate-700/70 pt-5">
                        <p className="text-xs leading-5 text-slate-500 ev-muted">
                          A análise considera somente as próximas doses registradas no EasyVacc e não confirma, por si só, que o calendário vacinal esteja completo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8 grid gap-4 md:grid-cols-3">
                <div className="ev-surface rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl transition hover:-translate-y-1 hover:border-emerald-500/20">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ev-green">
                      <Syringe size={20} />
                    </div>
                    <span className="ev-badge rounded-full bg-slate-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                      Carteira
                    </span>
                  </div>
                  <p className="text-3xl font-black text-white ev-title">
                    {situacao.totalRegistros}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-200 ev-text">
                    {situacao.totalRegistros === 1
                      ? 'Registro cadastrado'
                      : 'Registros cadastrados'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 ev-muted">
                    {situacao.totalRegistros === 0
                      ? 'Nenhuma dose cadastrada neste perfil.'
                      : 'Doses disponíveis na carteira selecionada.'}
                  </p>
                </div>

                <div className="ev-surface rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl transition hover:-translate-y-1 hover:border-amber-500/20">
                  <div className="mb-5 flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        situacao.atrasadas.length > 0
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-emerald-500/10 text-emerald-400 ev-green'
                      }`}
                    >
                      {situacao.atrasadas.length > 0 ? (
                        <AlertTriangle size={20} />
                      ) : (
                        <CheckCircle2 size={20} />
                      )}
                    </div>
                    <span className="ev-badge rounded-full bg-slate-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                      Atenção
                    </span>
                  </div>
                  <p className="text-3xl font-black text-white ev-title">
                    {situacao.atrasadas.length}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-200 ev-text">
                    {situacao.atrasadas.length === 1
                      ? 'Retorno atrasado'
                      : 'Retornos atrasados'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 ev-muted">
                    {situacao.atrasadas[0]
                      ? `${situacao.atrasadas[0].nome} · ${situacao.atrasadas[0].proximaDose}`
                      : 'Nenhum retorno vencido cadastrado.'}
                  </p>
                </div>

                <div className="ev-surface rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl transition hover:-translate-y-1 hover:border-cyan-500/20">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                      <CalendarDays size={20} />
                    </div>
                    <span className="ev-badge rounded-full bg-slate-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                      Agenda
                    </span>
                  </div>
                  <p className="text-lg font-black leading-tight text-white ev-title">
                    {situacao.proximaDose
                      ? situacao.proximaDose.nome
                      : 'Nenhum retorno futuro'}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-200 ev-text">
                    {situacao.proximaDose
                      ? `Prevista para ${situacao.proximaDose.data}`
                      : 'Sem próxima dose cadastrada'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 ev-muted">
                    Próximo retorno informado nos registros.
                  </p>
                </div>
              </section>

              {situacao.campanhasAplicaveis.length > 0 && (
                <section className="ev-campaign mb-8 overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/[0.08] to-emerald-500/[0.06] p-5 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                        <Megaphone size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">
                          Campanhas ativas
                        </p>
                        <h2 className="mt-1 text-base font-extrabold text-white ev-title">
                          {situacao.campanhasAplicaveis[0].titulo}
                        </h2>
                        {situacao.campanhasAplicaveis.length > 1 && (
                          <p className="mt-1 text-xs text-slate-400 ev-muted">
                            + {situacao.campanhasAplicaveis.length - 1}{' '}
                            {situacao.campanhasAplicaveis.length - 1 === 1
                              ? 'outra campanha ativa'
                              : 'outras campanhas ativas'}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      to="/campanhas"
                      className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-cyan-300"
                    >
                      Ver campanhas
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </section>
              )}

              <section className="mb-8">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 ev-muted">
                    Acesso rápido
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-white ev-title">
                    O que você precisa?
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      to: '/historico',
                      icon: Syringe,
                      titulo: 'Vacinação',
                      descricao: 'Consulte doses, lotes e próximos retornos.',
                    },
                    {
                      to: '/certificado',
                      icon: FileText,
                      titulo: 'Certificado',
                      descricao: 'Emita o comprovante dos registros da carteira.',
                    },
                    {
                      to: '/postos',
                      icon: MapPin,
                      titulo: 'Postos de saúde',
                      descricao: 'Encontre unidades cadastradas próximas de você.',
                    },
                    {
                      to: '/perfil',
                      icon: User,
                      titulo: 'Meu perfil',
                      descricao: 'Consulte e atualize seus dados pessoais.',
                    },
                  ].map((servico) => (
                    <Link
                      key={servico.to}
                      to={servico.to}
                      className="ev-service ev-surface group rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg transition hover:-translate-y-1 hover:border-emerald-500/20"
                    >
                      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/70 text-slate-300 transition group-hover:bg-emerald-500/10 group-hover:text-emerald-400">
                        <servico.icon size={19} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-extrabold text-white ev-title">
                          {servico.titulo}
                        </h3>
                        <ArrowRight
                          size={15}
                          className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-400"
                        />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-400 ev-muted">
                        {servico.descricao}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="ev-surface flex flex-col justify-between gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                    <User size={19} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white ev-title">
                      Dependentes
                    </h2>
                    <p className="mt-1 text-xs text-slate-400 ev-muted">
                      Gerencie as pessoas vinculadas à sua conta.
                    </p>
                  </div>
                </div>

                <Link
                  to="/dependentes"
                  className="ev-secondary inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-emerald-500/30"
                >
                  Gerenciar dependentes
                  <ArrowRight size={14} />
                </Link>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
