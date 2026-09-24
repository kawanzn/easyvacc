import { useEffect, useState } from 'react';
import {
  Search,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Syringe,
  Database,
  ChevronRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../services/supabase';

interface Vacina {
  id: number;
  nome: string;
  dataAplicacao: string;
  lote: string;
  fabricante: string;
  proximaDose: string;
}

interface VacinaBanco {
  id: number;
  nome: string;
  data_aplicacao: string;
  lote: string | null;
  fabricante: string | null;
  proxima_dose: string | null;
  usuario_id: string;
  dependente_id: number | null;
}

interface PessoaAtiva {
  tipo: 'titular' | 'dependente';
  id: string | number;
  nome: string;
}

function formatarData(data: string | null) {
  if (!data) {
    return '';
  }

  const partes = data.substring(0, 10).split('-');

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default function Historico() {
  const navigate = useNavigate();

  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [pessoaNome, setPessoaNome] = useState('');

  useEffect(() => {
    const carregarVacinas = async () => {
      setCarregando(true);
      setErro('');

      try {
        // ============================================
        // USUÁRIO AUTENTICADO
        // ============================================

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          navigate('/login');
          return;
        }

        // ============================================
        // DESCOBRIR QUEM ESTÁ SENDO CONSULTADO
        // ============================================

        let pessoaAtiva: PessoaAtiva | null = null;

        const pessoaSalva = localStorage.getItem('pessoaAtiva');

        if (pessoaSalva) {
          try {
            pessoaAtiva = JSON.parse(pessoaSalva);
          } catch {
            pessoaAtiva = null;
          }
        }

        // Se não houver pessoa selecionada,
        // consideramos o titular.
        if (!pessoaAtiva) {
          pessoaAtiva = {
            tipo: 'titular',
            id: user.id,
            nome:
              user.user_metadata?.nome ||
              'Titular',
          };
        }

        setPessoaNome(pessoaAtiva.nome);

        // ============================================
        // CONSULTA BASE
        // ============================================

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
            proxima_dose
          `)
          .eq('usuario_id', user.id);

        // ============================================
        // TITULAR OU DEPENDENTE
        // ============================================

        if (pessoaAtiva.tipo === 'dependente') {
          query = query.eq(
            'dependente_id',
            Number(pessoaAtiva.id)
          );
        } else {
          query = query.is(
            'dependente_id',
            null
          );
        }

        // ============================================
        // ORDENAR
        // ============================================

        const { data, error } = await query.order(
          'data_aplicacao',
          {
            ascending: false,
          }
        );

        if (error) {
          throw error;
        }

        const registros =
          (data ?? []) as VacinaBanco[];

        setVacinas(
          registros.map((vacina) => ({
            id: vacina.id,

            nome: vacina.nome,

            dataAplicacao:
              formatarData(
                vacina.data_aplicacao
              ),

            lote:
              vacina.lote || '',

            fabricante:
              vacina.fabricante || '',

            proximaDose:
              formatarData(
                vacina.proxima_dose
              ),
          }))
        );
      } catch (error: any) {
        console.error(
          'Erro ao buscar vacinas no Supabase:',
          error
        );

        setErro(
          error?.message ||
            'Não foi possível carregar o histórico de vacinação.'
        );
      } finally {
        setCarregando(false);
      }
    };

   void carregarVacinas();

// Atualiza quando trocar titular/dependente
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

  // ============================================
  // FILTRO
  // ============================================

  const vacinasFiltradas = vacinas.filter(
    (vacina) =>
      vacina.nome
        .toLowerCase()
        .includes(busca.toLowerCase())
  );

  // ============================================
  // KPIs
  // ============================================

  const vacinasComRetorno =
    vacinas.filter(
      (vacina) => vacina.proximaDose
    ).length;

  const vacinasConcluidas =
    vacinas.length - vacinasComRetorno;

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">

      {/* FUNDO */}

      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 overflow-hidden blur-3xl opacity-30">
        <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-emerald-500 to-teal-700 opacity-30" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

        {/* ====================================== */}
        {/* CABEÇALHO */}
        {/* ====================================== */}

        <header className="mb-10 flex flex-col justify-between gap-6 border-b border-slate-800/80 pb-8 lg:flex-row lg:items-end">

          <div>

            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">

              <ShieldCheck size={16} />

              <span>
                Caderneta Digital
              </span>

              <ChevronRight
                size={13}
                className="text-slate-600"
              />

              <span className="text-slate-300">
                Vacinação
              </span>

            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Histórico de vacinação
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Consulte os imunizantes registrados,
              datas de aplicação, lotes, fabricantes e
              informações sobre próximas doses.
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

        {/* ====================================== */}
        {/* ERRO */}
        {/* ====================================== */}

        {erro && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
            {erro}
          </div>
        )}

        {/* ====================================== */}
        {/* KPIs */}
        {/* ====================================== */}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-lg">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-200 ring-1 ring-slate-700">
              <Syringe size={22} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Total de registros
              </p>

              <p className="mt-1 text-2xl font-extrabold text-white">
                {vacinas.length}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-lg">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Doses sem retorno
              </p>

              <p className="mt-1 text-2xl font-extrabold text-white">
                {vacinasConcluidas}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-lg">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <Clock3 size={22} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Com retorno cadastrado
              </p>

              <p className="mt-1 text-2xl font-extrabold text-white">
                {vacinasComRetorno}
              </p>
            </div>

          </div>

        </section>

        {/* ====================================== */}
        {/* TABELA */}
        {/* ====================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-2xl backdrop-blur-md">

          <div className="flex flex-col justify-between gap-4 border-b border-slate-800/80 p-6 md:flex-row md:items-center">

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

            <div className="relative w-full md:w-80">

              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={busca}
                onChange={(e) =>
                  setBusca(e.target.value)
                }
                placeholder="Buscar por imunizante..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />

            </div>

          </div>

          {carregando ? (

            <div className="flex min-h-[320px] items-center justify-center">

              <div className="text-center">

                <Loader2 className="mx-auto mb-4 animate-spin text-emerald-500" />

                <p className="text-sm font-medium text-slate-400">
                  Carregando registros...
                </p>

              </div>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full border-collapse text-left">

                <thead>

                  <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">

                    <th className="px-6 py-4">
                      Imunizante
                    </th>

                    <th className="px-6 py-4">
                      Aplicação
                    </th>

                    <th className="px-6 py-4">
                      Lote
                    </th>

                    <th className="px-6 py-4">
                      Fabricante
                    </th>

                    <th className="px-6 py-4">
                      Situação
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-800/50">

                  {vacinasFiltradas.length > 0 ? (

                    vacinasFiltradas.map(
                      (vacina) => (

                        <tr
                          key={vacina.id}
                          className="transition-colors hover:bg-slate-800/40"
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

                          <td className="px-6 py-5 text-sm text-slate-300">

                            <div className="flex items-center gap-2">

                              <CalendarDays
                                size={15}
                                className="text-slate-500"
                              />

                              {vacina.dataAplicacao}

                            </div>

                          </td>

                          <td className="px-6 py-5 font-mono text-xs text-slate-400">
                            {vacina.lote || '—'}
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-300">
                            {vacina.fabricante ||
                              'Não informado'}
                          </td>

                          <td className="px-6 py-5">

                            {vacina.proximaDose ? (

                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">

                                <Clock3 size={13} />

                                Próxima:{' '}
                                {vacina.proximaDose}

                              </span>

                            ) : (

                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">

                                <CheckCircle2
                                  size={13}
                                />

                                Sem retorno

                              </span>

                            )}

                          </td>

                        </tr>

                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan={5}
                        className="px-6 py-20 text-center"
                      >

                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-800/50 text-slate-500">
                          <Syringe size={24} />
                        </div>

                        <p className="text-base font-semibold text-slate-200">

                          {busca
                            ? 'Nenhum registro encontrado'
                            : 'Nenhuma vacina registrada'}

                        </p>

                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">

                          {busca
                            ? 'Tente pesquisar utilizando outro nome de imunizante.'
                            : `Ainda não existem registros de vacinação para ${pessoaNome || 'esta pessoa'}.`}

                        </p>

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </div>
  );
}