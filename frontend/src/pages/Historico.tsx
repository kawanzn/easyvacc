import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
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


export default function Historico() {
  const navigate = useNavigate();

  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroSituacao>('todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [pessoaNome, setPessoaNome] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [temaClaro, setTemaClaro] = useState(false);

  useEffect(() => {
    const sincronizarTema = () => {
      setTemaClaro(Boolean(document.querySelector('.easyvacc-light')));
    };

    sincronizarTema();

    const observer = new MutationObserver(sincronizarTema);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

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
        setFotoPerfil(null);

        if (pessoaAtiva.tipo === 'titular') {
          const { data: perfil } = await supabase
            .from('users')
            .select('avatar_path')
            .eq('id', user.id)
            .maybeSingle();

          if (perfil?.avatar_path) {
            const { data: fotoAssinada } = await supabase.storage
              .from('avatars')
              .createSignedUrl(perfil.avatar_path, 60 * 60);

            if (fotoAssinada?.signedUrl) {
              setFotoPerfil(fotoAssinada.signedUrl);
            }
          }
        }

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
    <div
      className={`historico-caderneta min-h-screen overflow-x-hidden ${
        temaClaro ? 'bg-[#f4f7fb] text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {!temaClaro && (
        <style>{`
          .historico-caderneta .bg-white { background-color: rgb(15 23 42) !important; }
          .historico-caderneta .bg-slate-50 { background-color: rgb(2 6 23) !important; }
          .historico-caderneta .bg-slate-100 { background-color: rgb(30 41 59) !important; }
          .historico-caderneta .border-slate-200 { border-color: rgb(51 65 85) !important; }
          .historico-caderneta .border-slate-100 { border-color: rgb(30 41 59) !important; }
          .historico-caderneta .divide-slate-100 > :not([hidden]) ~ :not([hidden]) {
            border-color: rgb(30 41 59) !important;
          }
          .historico-caderneta .text-slate-950,
          .historico-caderneta .text-slate-900,
          .historico-caderneta .text-slate-800 { color: rgb(248 250 252) !important; }
          .historico-caderneta .text-slate-700 { color: rgb(226 232 240) !important; }
          .historico-caderneta .text-slate-600 { color: rgb(203 213 225) !important; }
          .historico-caderneta .text-slate-500,
          .historico-caderneta .text-slate-400 { color: rgb(148 163 184) !important; }
          .historico-caderneta tbody tr:hover { background-color: rgb(30 41 59 / 0.55) !important; }
          .historico-caderneta input.bg-slate-50 { background-color: rgb(2 6 23) !important; }

          /* Cards de resumo no modo escuro */
          .historico-caderneta .bg-emerald-50 {
            background-color: rgb(6 78 59 / 0.18) !important;
          }
          .historico-caderneta .border-emerald-100 {
            border-color: rgb(16 185 129 / 0.28) !important;
          }
          .historico-caderneta .bg-amber-50 {
            background-color: rgb(120 53 15 / 0.18) !important;
          }
          .historico-caderneta .border-amber-100 {
            border-color: rgb(245 158 11 / 0.28) !important;
          }
          .historico-caderneta .bg-red-50 {
            background-color: rgb(127 29 29 / 0.18) !important;
          }
          .historico-caderneta .border-red-100 {
            border-color: rgb(239 68 68 / 0.28) !important;
          }

          .historico-caderneta .bg-emerald-50 .text-slate-950,
          .historico-caderneta .bg-amber-50 .text-slate-950,
          .historico-caderneta .bg-red-50 .text-slate-950 {
            color: rgb(248 250 252) !important;
          }
          .historico-caderneta .bg-emerald-50 .text-slate-600 {
            color: rgb(110 231 183) !important;
          }
          .historico-caderneta .bg-amber-50 .text-slate-600 {
            color: rgb(252 211 77) !important;
          }
          .historico-caderneta .bg-red-50 .text-slate-600 {
            color: rgb(252 165 165) !important;
          }
        `}</style>
      )}
      <main className="mx-auto w-full max-w-[1180px] px-3 py-5 sm:px-5 lg:px-6">
        <header className="mb-4">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700">
            <ShieldCheck size={15} />
            Caderneta Digital
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Caderneta de Vacinação
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
            Histórico de imunizações e próximos retornos registrados no EasyVacc.
          </p>
        </header>

        {erro && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            {erro}
          </div>
        )}

        <section className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-50 bg-slate-100 shadow-sm sm:h-[72px] sm:w-[72px]">
              {fotoPerfil ? (
                <img
                  src={fotoPerfil}
                  alt={`Foto de ${pessoaNome || 'perfil'}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black uppercase text-emerald-700">
                  {(pessoaNome || 'U').trim().charAt(0)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Caderneta de
              </p>
              <h2 className="mt-0.5 break-words text-xl font-black text-slate-950 sm:text-2xl">
                {pessoaNome || 'Usuário'}
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Registro pessoal de vacinação
              </p>
            </div>
          </div>
        </section>

        <section className="mb-3 grid grid-cols-3 gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 sm:px-4">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm sm:flex">
              <Syringe size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-slate-950 sm:text-xl">{totais.total}</p>
              <p className="mt-1 truncate text-[10px] font-bold text-slate-600 sm:text-xs">
                Registros
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 sm:px-4">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-amber-600 shadow-sm sm:flex">
              <CalendarDays size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-slate-950 sm:text-xl">{totais.proximas}</p>
              <p className="mt-1 truncate text-[10px] font-bold text-slate-600 sm:text-xs">
                Próximas doses
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3 py-3 sm:px-4">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-red-600 shadow-sm sm:flex">
              <AlertTriangle size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-slate-950 sm:text-xl">{totais.atrasadas}</p>
              <p className="mt-1 truncate text-[10px] font-bold text-slate-600 sm:text-xs">
                Atrasadas
              </p>
            </div>
          </div>
        </section>

        <section className="mb-3 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {botoesFiltro.map((botao) => {
              const ativo = filtro === botao.valor;

              return (
                <button
                  key={botao.valor}
                  type="button"
                  onClick={() => setFiltro(botao.valor)}
                  aria-pressed={ativo}
                  className={`rounded-lg px-2 py-2 text-xs font-extrabold transition ${
                    ativo
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {botao.rotulo}
                  <span className="ml-1 opacity-80">({botao.quantidade})</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Vacinas registradas</h2>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                {vacinasFiltradas.length}{' '}
                {vacinasFiltradas.length === 1 ? 'registro encontrado' : 'registros encontrados'}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <label htmlFor="busca-vacina" className="sr-only">
                Buscar vacina
              </label>
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="busca-vacina"
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar vacina, fabricante ou lote..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {carregando ? (
            <div className="flex min-h-52 items-center justify-center gap-2 text-sm font-medium text-slate-500">
              <Loader2 size={19} className="animate-spin text-emerald-600" />
              Carregando caderneta...
            </div>
          ) : vacinasFiltradas.length > 0 ? (
            <>
              <div className="hidden md:block">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[21%]" />
                    <col className="w-[10%]" />
                    <col className="w-[14%]" />
                    <col className="w-[15%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                  </colgroup>

                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100">
                      <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide text-slate-700">Vacina</th>
                      <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide text-slate-700">Dose</th>
                      <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide text-slate-700">Aplicação</th>
                      <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide text-slate-700">Fabricante</th>
                      <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide text-slate-700">Lote</th>
                      <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide text-slate-700">Próxima dose</th>
                      <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-wide text-slate-700">Situação</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {vacinasFiltradas.map((vacina) => (
                      <tr key={vacina.id} className="align-middle hover:bg-slate-50">
                        <td className="px-3 py-3.5">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                              <Syringe size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="break-words text-xs font-extrabold leading-4 text-slate-950">
                                {vacina.nome}
                              </p>
                              <p className="mt-0.5 truncate text-[9px] font-medium text-slate-400">
                                {vacina.registradoPor ? 'Profissional de saúde' : 'EasyVacc'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-xs font-semibold text-slate-700">
                          {vacina.dose || '—'}
                        </td>

                        <td className="px-3 py-3.5 text-xs font-semibold text-slate-700">
                          {vacina.dataAplicacao || '—'}
                        </td>

                        <td className="px-3 py-3.5 text-xs font-medium text-slate-700">
                          <span className="block break-words">{vacina.fabricante || '—'}</span>
                        </td>

                        <td className="px-3 py-3.5 font-mono text-[11px] font-semibold text-slate-700">
                          <span className="block break-all">{vacina.lote || '—'}</span>
                        </td>

                        <td className="px-3 py-3.5 text-xs font-semibold text-slate-700">
                          {vacina.proximaDose || '—'}
                        </td>

                        <td className="px-3 py-3.5">
                          {vacina.situacao === 'atrasada' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-[10px] font-extrabold text-red-700">
                              <AlertTriangle size={11} />
                              Atrasada
                            </span>
                          ) : vacina.situacao === 'proxima' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-extrabold text-amber-700">
                              <Clock3 size={11} />
                              Próxima
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-700">
                              <CheckCircle2 size={11} />
                              Aplicada
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {vacinasFiltradas.map((vacina) => (
                  <article key={vacina.id} className="p-4">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <Syringe size={15} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-black text-slate-950">
                            {vacina.nome}
                          </h3>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            {vacina.dose || 'Dose não informada'}
                          </p>
                        </div>
                      </div>

                      {vacina.situacao === 'atrasada' ? (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[10px] font-extrabold text-red-700">
                          Atrasada
                        </span>
                      ) : vacina.situacao === 'proxima' ? (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-extrabold text-amber-700">
                          Próxima
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-700">
                          Aplicada
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Aplicação</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-700">{vacina.dataAplicacao || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Fabricante</p>
                        <p className="mt-0.5 break-words text-xs font-semibold text-slate-700">{vacina.fabricante || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Lote</p>
                        <p className="mt-0.5 break-all font-mono text-xs font-semibold text-slate-700">{vacina.lote || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Próxima dose</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-700">{vacina.proximaDose || '—'}</p>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-slate-100 pt-3 text-[10px] leading-4 text-slate-400">
                      <p>
                        {vacina.registradoPor
                          ? 'Registrado por profissional de saúde'
                          : 'Registro interno do EasyVacc'}
                      </p>
                      {vacina.profissional && <p>Profissional: {vacina.profissional}</p>}
                      {vacina.posto && <p>Unidade: {vacina.posto}</p>}
                      {vacina.registradoEm && (
                        <p>Registrado em: {formatarDataHora(vacina.registradoEm)}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="px-5 py-14 text-center">
              <Syringe size={25} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">
                {busca || filtro !== 'todos'
                  ? 'Nenhum registro encontrado'
                  : 'Nenhuma vacina registrada'}
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-400">
                {busca || filtro !== 'todos'
                  ? 'Altere a busca ou o filtro para consultar outros registros.'
                  : `Ainda não existem registros de vacinação para ${pessoaNome || 'esta pessoa'}.`}
              </p>
            </div>
          )}
        </section>

        <p className="mt-3 px-1 text-[10px] leading-4 text-slate-400">
          <strong className="font-bold text-slate-500">Importante:</strong> a situação considera
          os registros e a próxima dose cadastrada no EasyVacc. “Em dia” significa apenas que
          não há retorno vencido registrado.
        </p>
      </main>
    </div>
  );
}
