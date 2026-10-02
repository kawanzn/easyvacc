import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Filter,
  Loader2,
  Search,
  ShieldCheck,
  Syringe,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

type FiltroSituacao = 'todos' | 'em_dia' | 'proxima' | 'atrasada';
type SituacaoVacina = Exclude<FiltroSituacao, 'todos'>;

interface VacinaBanco {
  id: number;
  nome: string;
  data_aplicacao: string;
  lote: string | null;
  fabricante: string | null;
  dose: string | null;
  proxima_dose: string | null;
  usuario_id: string;
  dependente_id: number | null;
  registrado_por: string | null;
  registrado_em: string | null;
  profissional: string | null;
  posto: string | null;
  status: string;
}

interface Vacina {
  id: number;
  nome: string;
  dataAplicacao: string;
  dataAplicacaoISO: string;
  lote: string;
  fabricante: string;
  dose: string;
  proximaDose: string;
  proximaDoseISO: string | null;
  situacao: SituacaoVacina;
  registradoPor: string | null;
  registradoEm: string | null;
  profissional: string | null;
  posto: string | null;
}

interface PessoaAtiva {
  tipo: 'titular' | 'dependente';
  id: string | number;
  nome: string;
}

function formatarData(data: string | null) {
  if (!data) return '';
  const partes = data.substring(0, 10).split('-');
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataHora(data: string | null) {
  if (!data) return '';
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(valor);
}

function dataLocalISO() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function calcularSituacao(proximaDose: string | null): SituacaoVacina {
  if (!proximaDose) return 'em_dia';

  const proxima = proximaDose.substring(0, 10);
  const hoje = dataLocalISO();

  if (proxima < hoje) return 'atrasada';
  return 'proxima';
}

function textoSituacao(situacao: SituacaoVacina) {
  if (situacao === 'atrasada') return 'Dose atrasada';
  if (situacao === 'proxima') return 'Próxima dose';
  return 'Em dia';
}

export default function Historico() {
  const navigate = useNavigate();

  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroSituacao>('todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [pessoaNome, setPessoaNome] = useState('');

  useEffect(() => {
    const carregarVacinas = async () => {
      setCarregando(true);
      setErro('');

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          navigate('/login');
          return;
        }

        let pessoaAtiva: PessoaAtiva | null = null;
        const pessoaSalva = localStorage.getItem('pessoaAtiva');

        if (pessoaSalva) {
          try {
            pessoaAtiva = JSON.parse(pessoaSalva) as PessoaAtiva;
          } catch {
            pessoaAtiva = null;
          }
        }

        if (!pessoaAtiva) {
          pessoaAtiva = {
            tipo: 'titular',
            id: user.id,
            nome: user.user_metadata?.nome || 'Titular',
          };
        }

        setPessoaNome(pessoaAtiva.nome);

        let query = supabase
          .from('vacinas')
          .select(`
            id,
            usuario_id,
            dependente_id,
            nome,
            data_aplicacao,
            lote,
            fabricante,
            dose,
            proxima_dose,
            registrado_por,
            registrado_em,
            profissional,
            posto,
            status
          `)
          .eq('usuario_id', user.id)
          .in('status', ['ativo', 'corrigido']);

        if (pessoaAtiva.tipo === 'dependente') {
          query = query.eq('dependente_id', Number(pessoaAtiva.id));
        } else {
          query = query.is('dependente_id', null);
        }

        const { data, error } = await query.order('data_aplicacao', {
          ascending: false,
        });

        if (error) throw error;

        const registros = (data ?? []) as VacinaBanco[];

        setVacinas(
          registros.map((vacina) => ({
            id: vacina.id,
            nome: vacina.nome,
            dataAplicacao: formatarData(vacina.data_aplicacao),
            dataAplicacaoISO: vacina.data_aplicacao,
            lote: vacina.lote || '',
            fabricante: vacina.fabricante || '',
            dose: vacina.dose || '',
            proximaDose: formatarData(vacina.proxima_dose),
            proximaDoseISO: vacina.proxima_dose,
            situacao: calcularSituacao(vacina.proxima_dose),
            registradoPor: vacina.registrado_por,
            registradoEm: vacina.registrado_em,
            profissional: vacina.profissional,
            posto: vacina.posto,
          }))
        );
      } catch (error: any) {
        console.error('Erro ao buscar vacinas no Supabase:', error);
        setErro(
          error?.message ||
            'Não foi possível carregar a carteira de vacinação.'
        );
      } finally {
        setCarregando(false);
      }
    };

    void carregarVacinas();

    const handlePessoaAtivaAtualizada = () => {
      void carregarVacinas();
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
  }, [navigate]);

  const totais = useMemo(() => {
    return {
      total: vacinas.length,
      emDia: vacinas.filter((vacina) => vacina.situacao === 'em_dia').length,
      proximas: vacinas.filter((vacina) => vacina.situacao === 'proxima').length,
      atrasadas: vacinas.filter((vacina) => vacina.situacao === 'atrasada').length,
    };
  }, [vacinas]);

  const vacinasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return vacinas.filter((vacina) => {
      const correspondeBusca =
        !termo ||
        vacina.nome.toLowerCase().includes(termo) ||
        vacina.fabricante.toLowerCase().includes(termo) ||
        vacina.lote.toLowerCase().includes(termo);

      const correspondeSituacao =
        filtro === 'todos' || vacina.situacao === filtro;

      return correspondeBusca && correspondeSituacao;
    });
  }, [vacinas, busca, filtro]);

  const botoesFiltro: Array<{
    valor: FiltroSituacao;
    rotulo: string;
    quantidade: number;
  }> = [
    { valor: 'todos', rotulo: 'Todos', quantidade: totais.total },
    { valor: 'em_dia', rotulo: 'Em dia', quantidade: totais.emDia },
    { valor: 'proxima', rotulo: 'Próximas', quantidade: totais.proximas },
    { valor: 'atrasada', rotulo: 'Atrasadas', quantidade: totais.atrasadas },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 overflow-hidden blur-3xl opacity-30">
        <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-emerald-500 to-teal-700 opacity-30" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header className="mb-10 flex flex-col justify-between gap-6 border-b border-slate-800/80 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              <ShieldCheck size={16} />
              <span>Caderneta Digital</span>
              <ChevronRight size={13} className="text-slate-600" />
              <span className="text-slate-300">Vacinação</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Carteira de vacinação
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Consulte os registros disponíveis no EasyVacc, acompanhe próximas
              doses e identifique retornos com data já vencida.
            </p>

            {pessoaNome && (
              <p className="mt-3 text-sm font-semibold text-emerald-400">
                Caderneta de: {pessoaNome}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-xl backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Database size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Base de dados
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Supabase
              </div>
            </div>
          </div>
        </header>

        {erro && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-300"
          >
            {erro}
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-200 ring-1 ring-slate-700">
              <Syringe size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Total de registros</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{totais.total}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Em dia</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{totais.emDia}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <Clock3 size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Próximas doses</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{totais.proximas}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Atrasadas</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{totais.atrasadas}</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-800/80 p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Registros de imunização
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {vacinasFiltradas.length}{' '}
                  {vacinasFiltradas.length === 1
                    ? 'registro encontrado'
                    : 'registros encontrados'}
                </p>
              </div>

              <div className="relative w-full lg:w-80">
                <label htmlFor="busca-vacina" className="sr-only">
                  Buscar imunizante
                </label>
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="busca-vacina"
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por imunizante, lote..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="mr-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Filter size={15} />
                Situação:
              </div>

              {botoesFiltro.map((botao) => {
                const ativo = filtro === botao.valor;

                return (
                  <button
                    key={botao.valor}
                    type="button"
                    onClick={() => setFiltro(botao.valor)}
                    aria-pressed={ativo}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      ativo
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {botao.rotulo} ({botao.quantidade})
                  </button>
                );
              })}
            </div>
          </div>

          {carregando ? (
            <div className="min-h-[360px] p-6">
              <div className="mb-4 h-16 animate-pulse rounded-xl bg-slate-800/60" />
              <div className="mb-4 h-16 animate-pulse rounded-xl bg-slate-800/50" />
              <div className="mb-4 h-16 animate-pulse rounded-xl bg-slate-800/40" />
              <div className="mt-8 flex items-center justify-center gap-3 text-sm text-slate-400">
                <Loader2 className="animate-spin text-emerald-500" size={19} />
                Carregando carteira...
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Imunizante</th>
                    <th className="px-6 py-4">Dose</th>
                    <th className="px-6 py-4">Aplicação</th>
                    <th className="px-6 py-4">Lote</th>
                    <th className="px-6 py-4">Fabricante</th>
                    <th className="px-6 py-4">Situação</th>
                    <th className="px-6 py-4">Origem</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/50">
                  {vacinasFiltradas.length > 0 ? (
                    vacinasFiltradas.map((vacina) => (
                      <tr
                        key={vacina.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          vacina.situacao === 'atrasada' ? 'bg-red-500/[0.025]' : ''
                        }`}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 text-emerald-400">
                              <Syringe size={18} />
                            </div>
                            <span className="text-sm font-semibold text-slate-100">
                              {vacina.nome}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm font-semibold text-slate-300">
                          {vacina.dose || '—'}
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-300">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={15} className="text-slate-500" />
                            {vacina.dataAplicacao}
                          </div>
                        </td>

                        <td className="px-6 py-5 font-mono text-xs text-slate-400">
                          {vacina.lote || '—'}
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-300">
                          {vacina.fabricante || 'Não informado'}
                        </td>

                        <td className="px-6 py-5">
                          {vacina.situacao === 'atrasada' && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                              <AlertTriangle size={13} />
                              {textoSituacao(vacina.situacao)}
                              {vacina.proximaDose ? `: ${vacina.proximaDose}` : ''}
                            </span>
                          )}

                          {vacina.situacao === 'proxima' && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                              <Clock3 size={13} />
                              Próxima: {vacina.proximaDose}
                            </span>
                          )}

                          {vacina.situacao === 'em_dia' && (
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                                <CheckCircle2 size={13} />
                                Em dia
                              </span>
                              <p className="mt-1.5 text-[11px] text-slate-500">
                                Sem retorno cadastrado
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <div className="min-w-[220px] space-y-1.5">
                            <span className="inline-flex rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                              {vacina.registradoPor
                                ? 'Registrado por profissional de saúde'
                                : 'Registro interno do EasyVacc'}
                            </span>

                            {vacina.profissional && (
                              <p className="text-xs font-semibold text-slate-300">
                                Profissional: {vacina.profissional}
                              </p>
                            )}

                            {vacina.posto && (
                              <p className="text-xs text-slate-400">
                                Unidade: {vacina.posto}
                              </p>
                            )}

                            {vacina.registradoEm && (
                              <p className="text-[11px] text-slate-500">
                                Registrado em: {formatarDataHora(vacina.registradoEm)}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-800/50 text-slate-500">
                          <Syringe size={24} />
                        </div>
                        <p className="text-base font-semibold text-slate-200">
                          {busca || filtro !== 'todos'
                            ? 'Nenhum registro encontrado'
                            : 'Nenhuma vacina registrada'}
                        </p>
                        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                          {busca || filtro !== 'todos'
                            ? 'Altere a busca ou o filtro de situação para consultar outros registros.'
                            : `Ainda não existem registros de vacinação para ${
                                pessoaNome || 'esta pessoa'
                              }.`}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs leading-relaxed text-slate-500">
          <strong className="text-slate-400">Importante:</strong> a situação exibida
          nesta tela é calculada somente a partir dos registros e da próxima dose
          cadastrada no EasyVacc. “Em dia” significa que não existe retorno vencido
          registrado e não representa, por si só, confirmação de esquema vacinal
          completo pelo SUS.
        </div>
      </div>
    </div>
  );
}
