import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User,
  ShieldCheck,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Calendar,
  CreditCard,
  Loader2,
} from 'lucide-react';

import { supabase } from '../services/supabase';
import { salvarPessoaAtiva } from '../lib/brasil';

interface Dependente {
  id: number;
  nome: string;
  parentesco: string;
  dataNascimento: string;
  cartaoSus: string;
}

interface DependenteBanco {
  id: number;
  usuario_id: string;
  nome: string;
  parentesco: string | null;
  data_nascimento: string | null;
  cns: string | null;
}

function formatarData(dataIso: string) {
  if (!dataIso) return 'Não informada';

  const partes = dataIso.substring(0, 10).split('-');

  if (partes.length !== 3) {
    return dataIso;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default function AdicionarDependente() {
  const navigate = useNavigate();

  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [nome, setNome] = useState('');
  const [parentesco, setParentesco] = useState('Filho(a)');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cartaoSus, setCartaoSus] = useState('');

  // =====================================================
  // BUSCAR DEPENDENTES
  // =====================================================

  const carregarDependentes = async () => {
    setLoading(true);
    setErro('');

    try {
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

      const { data, error } = await supabase
        .from('dependentes')
        .select(`
          id,
          usuario_id,
          nome,
          parentesco,
          data_nascimento,
          cns
        `)
        .eq('usuario_id', user.id)
        .order('nome', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const lista = (data ?? []) as DependenteBanco[];

      setDependentes(
        lista.map((dependente) => ({
          id: dependente.id,

          nome: dependente.nome,

          parentesco:
            dependente.parentesco || 'Outro',

          dataNascimento:
            dependente.data_nascimento || '',

          cartaoSus:
            dependente.cns || 'Não informado',
        }))
      );
    } catch (error: any) {
      console.error(
        'Erro ao buscar dependentes:',
        error
      );

      setErro(
        error?.message ||
          'Não foi possível carregar os dependentes.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CARREGAR AO ABRIR
  // =====================================================

  useEffect(() => {
    void carregarDependentes();
  }, []);

  // =====================================================
  // CADASTRAR DEPENDENTE
  // =====================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErro('');
    setSucesso('');

    if (!nome.trim()) {
      setErro('Informe o nome do dependente.');
      return;
    }

    if (!dataNascimento) {
      setErro('Informe a data de nascimento.');
      return;
    }

    const hoje = new Date()
      .toISOString()
      .split('T')[0];

    if (dataNascimento > hoje) {
      setErro(
        'A data de nascimento não pode ser futura.'
      );
      return;
    }

    const cnsLimpo = cartaoSus.replace(/\D/g, '');

    if (
      cnsLimpo.length > 0 &&
      cnsLimpo.length !== 15
    ) {
      setErro(
        'O Cartão SUS (CNS) deve possuir 15 dígitos.'
      );
      return;
    }

    setSalvando(true);

    try {
      // ==============================================
      // PEGAR USUÁRIO LOGADO
      // ==============================================

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

      // ==============================================
      // INSERT NO SUPABASE
      // ==============================================

      const {
        data,
        error,
      } = await supabase
        .from('dependentes')
        .insert({
          usuario_id: user.id,

          nome: nome.trim(),

          parentesco,

          data_nascimento:
            dataNascimento,

          cns:
            cnsLimpo || null,
        })
        .select(`
          id,
          usuario_id,
          nome,
          parentesco,
          data_nascimento,
          cns
        `)
        .single();

      if (error) {
        throw error;
      }

      // ==============================================
      // ADICIONAR NA TELA
      // ==============================================

      const novo: Dependente = {
        id: data.id,

        nome: data.nome,

        parentesco:
          data.parentesco || 'Outro',

        dataNascimento:
          data.data_nascimento || '',

        cartaoSus:
          data.cns || 'Não informado',
      };

      setDependentes((anteriores) =>
        [...anteriores, novo].sort(
          (a, b) =>
            a.nome.localeCompare(
              b.nome,
              'pt-BR'
            )
        )
      );

      // ==============================================
      // LIMPAR FORMULÁRIO
      // ==============================================

      setNome('');
      setParentesco('Filho(a)');
      setDataNascimento('');
      setCartaoSus('');

      setSucesso(
        'Dependente cadastrado com sucesso.'
      );

      // Atualiza o Layout

      window.dispatchEvent(
        new Event('dependenteAtualizado')
      );
    } catch (error: any) {
      console.error(
        'Erro ao cadastrar dependente:',
        error
      );

      if (error?.code === '23514') {
        setErro(
          'O CNS informado não possui um formato válido.'
        );
      } else if (error?.code === '23505') {
        setErro(
          'Esse dependente já está cadastrado.'
        );
      } else {
        setErro(
          error?.message ||
            'Não foi possível cadastrar o dependente.'
        );
      }
    } finally {
      setSalvando(false);
    }
  };

  // =====================================================
  // REMOVER DEPENDENTE
  // =====================================================

  const handleRemove = async (
    id: number
  ) => {
    const confirmar = window.confirm(
      'Deseja realmente remover este dependente?'
    );

    if (!confirmar) {
      return;
    }

    setErro('');
    setSucesso('');
    setRemovendoId(id);

    try {
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

      const { error } = await supabase
        .from('dependentes')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) {
        throw error;
      }

      setDependentes((anteriores) =>
        anteriores.filter(
          (dependente) =>
            dependente.id !== id
        )
      );

      setSucesso(
        'Dependente removido com sucesso.'
      );

      window.dispatchEvent(
        new Event('dependenteAtualizado')
      );
    } catch (error: any) {
      console.error(
        'Erro ao remover dependente:',
        error
      );

      setErro(
        error?.message ||
          'Não foi possível remover o dependente.'
      );
    } finally {
      setRemovendoId(null);
    }
  };

  // =====================================================
  // ABRIR CADERNETA
  // =====================================================

  const abrirCaderneta = (
    dependente: Dependente
  ) => {
    salvarPessoaAtiva({
      tipo: 'dependente',
      id: dependente.id,
      nome: dependente.nome,
    });

    navigate('/historico');
  };

  return (
    <div className="relative min-h-screen bg-slate-950 p-6 text-slate-100 antialiased md:p-10">

      {/* Background */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/15 via-[#00a884]/20 to-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8">

        {/* ================================================= */}
        {/* CABEÇALHO */}
        {/* ================================================= */}

        <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">

              <Link
                to="/dashboard"
                className="transition-colors hover:text-white"
              >
                EASYVACC
              </Link>

              <ChevronRight
                size={12}
                className="text-slate-500"
              />

              <span className="text-[#00a884]">
                DEPENDENTES
              </span>

            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Gestão de Dependentes
            </h1>

            <p className="mt-1 text-xs text-slate-400 md:text-sm">
              Cadastre e acompanhe os dependentes
              vinculados à sua conta.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/dashboard')
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur-xl transition-all hover:border-slate-700 hover:text-white"
          >

            <ArrowLeft size={15} />

            Voltar ao Início

          </button>

        </div>

        {/* ================================================= */}
        {/* MENSAGENS */}
        {/* ================================================= */}

        {erro && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-300">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-300">
            {sucesso}
          </div>
        )}

        {/* ================================================= */}
        {/* CONTEÚDO */}
        {/* ================================================= */}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

          {/* FORMULÁRIO */}

          <div className="lg:col-span-5">

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">

              <div className="mb-6 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00a884]/30 bg-[#00a884]/10 text-[#00a884]">
                  <UserPlus size={18} />
                </div>

                <div>

                  <h2 className="text-base font-bold text-white">
                    Novo Dependente
                  </h2>

                  <p className="text-xs text-slate-400">
                    Os dados serão salvos diretamente no Supabase
                  </p>

                </div>

              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >

                {/* NOME */}

                <div>

                  <label className="block text-xs font-semibold text-slate-300">
                    Nome Completo{' '}
                    <span className="text-[#00a884]">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas Gentil"
                    value={nome}
                    onChange={(e) =>
                      setNome(e.target.value)
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#00a884] focus:outline-none"
                  />

                </div>

                {/* PARENTESCO */}

                <div>

                  <label className="block text-xs font-semibold text-slate-300">
                    Parentesco
                  </label>

                  <select
                    value={parentesco}
                    onChange={(e) =>
                      setParentesco(
                        e.target.value
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-[#00a884] focus:outline-none"
                  >

                    <option value="Filho(a)">
                      Filho(a)
                    </option>

                    <option value="Cônjuge">
                      Cônjuge
                    </option>

                    <option value="Pai/Mãe">
                      Pai/Mãe
                    </option>

                    <option value="Tutelado(a)">
                      Tutelado(a)
                    </option>

                    <option value="Outro">
                      Outro
                    </option>

                  </select>

                </div>

                {/* DATA NASCIMENTO */}

                <div>

                  <label className="block text-xs font-semibold text-slate-300">
                    Data de Nascimento{' '}
                    <span className="text-[#00a884]">
                      *
                    </span>
                  </label>

                  <input
                    type="date"
                    required
                    max={
                      new Date()
                        .toISOString()
                        .split('T')[0]
                    }
                    value={dataNascimento}
                    onChange={(e) =>
                      setDataNascimento(
                        e.target.value
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-[#00a884] focus:outline-none [color-scheme:dark]"
                  />

                </div>

                {/* CNS */}

                <div>

                  <label className="block text-xs font-semibold text-slate-300">
                    Nº Cartão SUS{' '}
                    <span className="font-normal text-slate-500">
                      (Opcional)
                    </span>
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={18}
                    placeholder="000 0000 0000 0000"
                    value={cartaoSus}
                    onChange={(e) => {
                      const valor =
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 15);

                      setCartaoSus(valor);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#00a884] focus:outline-none"
                  />

                </div>

                {/* BOTÃO */}

                <button
                  type="submit"
                  disabled={salvando}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00a884] py-3 text-xs font-semibold text-slate-950 shadow-lg shadow-[#00a884]/20 transition-all hover:bg-[#00c49a] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {salvando ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <UserPlus size={15} />
                  )}

                  {salvando
                    ? 'Salvando...'
                    : 'Salvar Dependente'}

                </button>

              </form>

            </div>

          </div>

          {/* ================================================= */}
          {/* LISTA */}
          {/* ================================================= */}

          <div className="space-y-4 lg:col-span-7">

            <div className="flex items-center justify-between">

              <h2 className="text-base font-bold text-white">
                Dependentes Cadastrados
              </h2>

              <span className="rounded-full border border-[#00a884]/30 bg-[#00a884]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00a884]">
                {dependentes.length}
              </span>

            </div>

            {loading ? (

              <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400">

                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Carregando dependentes...

              </div>

            ) : dependentes.length === 0 ? (

              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">

                <User
                  size={28}
                  className="text-slate-500"
                />

                <h3 className="mt-3 text-sm font-bold text-slate-200">
                  Nenhum dependente cadastrado
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Utilize o formulário para adicionar
                  seu primeiro dependente.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {dependentes.map(
                  (dependente) => (

                    <div
                      key={dependente.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl"
                    >

                      <div className="flex items-start justify-between">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00a884]/30 bg-[#00a884]/10 text-[#00a884]">

                            <User size={20} />

                          </div>

                          <div>

                            <h3 className="text-sm font-bold text-white">
                              {dependente.nome}
                            </h3>

                            <span className="mt-0.5 inline-block rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                              {dependente.parentesco}
                            </span>

                          </div>

                        </div>

                        <button
                          type="button"
                          disabled={
                            removendoId ===
                            dependente.id
                          }
                          onClick={() =>
                            handleRemove(
                              dependente.id
                            )
                          }
                          className="rounded-lg p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        >

                          {removendoId ===
                          dependente.id ? (

                            <Loader2
                              size={16}
                              className="animate-spin"
                            />

                          ) : (

                            <Trash2 size={16} />

                          )}

                        </button>

                      </div>

                      <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-xs">

                        <div className="flex justify-between">

                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Calendar size={13} />
                            Nascimento:
                          </span>

                          <span className="font-semibold text-slate-200">
                            {formatarData(
                              dependente.dataNascimento
                            )}
                          </span>

                        </div>

                        <div className="flex justify-between">

                          <span className="flex items-center gap-1.5 text-slate-400">
                            <CreditCard size={13} />
                            Cartão SUS:
                          </span>

                          <span className="font-semibold text-slate-200">
                            {dependente.cartaoSus}
                          </span>

                        </div>

                        <div className="flex justify-between">

                          <span className="flex items-center gap-1.5 text-slate-400">
                            <ShieldCheck size={13} />
                            Situação:
                          </span>

                          <span className="font-semibold text-slate-300">
                            Consulte a caderneta
                          </span>

                        </div>

                      </div>

                      <div className="mt-4 border-t border-slate-800 pt-3">

                        <button
                          type="button"
                          onClick={() =>
                            abrirCaderneta(
                              dependente
                            )
                          }
                          className="flex w-full items-center justify-between text-xs font-semibold text-[#00a884] hover:text-[#00c49a]"
                        >

                          <span>
                            Ver caderneta completa
                          </span>

                          <ChevronRight
                            size={14}
                          />

                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}