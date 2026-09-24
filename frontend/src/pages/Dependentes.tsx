import { useEffect, useState } from 'react';
import {
  ChevronRight,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { supabase } from '../services/supabase';
import { salvarPessoaAtiva } from '../lib/brasil';

interface DependenteBanco {
  id: number;
  usuario_id: string;
  nome: string;
  parentesco: string | null;
  data_nascimento: string | null;
  cns: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Dependente {
  id: number;
  nome: string;
  parentesco: string;
  dataNascimento: string;
  cns: string;
  statusVacinal: string;
}

export default function Dependentes() {
  const navigate = useNavigate();

  const [dependentes, setDependentes] =
    useState<Dependente[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [removendoId, setRemovendoId] =
    useState<number | null>(null);

  const [erro, setErro] =
    useState('');

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [novoDependente, setNovoDependente] =
    useState({
      nome: '',
      parentesco: 'Filho(a)',
      dataNascimento: '',
      cns: '',
    });

  // ==========================================
  // FORMATAR DATA
  // ==========================================

  const formatarData = (
    data: string | null
  ) => {
    if (!data) {
      return 'Não informada';
    }

    const partes =
      data.substring(0, 10).split('-');

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // ==========================================
  // CARREGAR DEPENDENTES
  // ==========================================

  const carregarDependentes = async () => {
    setCarregando(true);
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

      const {
        data,
        error,
      } = await supabase
        .from('dependentes')
        .select(`
          id,
          usuario_id,
          nome,
          parentesco,
          data_nascimento,
          cns,
          created_at,
          updated_at
        `)
        .eq('usuario_id', user.id)
        .order('nome', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const formatados: Dependente[] =
        (
          (data ?? []) as DependenteBanco[]
        ).map((dep) => ({
          id: dep.id,

          nome: dep.nome,

          parentesco:
            dep.parentesco || 'Outro',

          dataNascimento:
            formatarData(
              dep.data_nascimento
            ),

          cns:
            dep.cns ||
            'Não informado',

          /*
           * Por enquanto não vamos inventar
           * situação vacinal.
           *
           * Depois, quando migrarmos vacinas,
           * calcularemos isso com os registros.
           */
          statusVacinal:
            'Consultar caderneta',
        }));

      setDependentes(formatados);

    } catch (error) {
      console.error(
        'Erro ao buscar dependentes:',
        error
      );

      setErro(
        'Não foi possível carregar os dependentes.'
      );

    } finally {
      setCarregando(false);
    }
  };

  // ==========================================
  // CARREGAR AO ABRIR
  // ==========================================

  useEffect(() => {
    void carregarDependentes();
  }, []);

  // ==========================================
  // ADICIONAR DEPENDENTE
  // ==========================================

  const handleAddDependente = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErro('');

    // Nome

    if (!novoDependente.nome.trim()) {
      setErro(
        'Informe o nome do dependente.'
      );

      return;
    }

    // Data

    const dataAtual =
      new Date()
        .toISOString()
        .split('T')[0];

    if (
      novoDependente.dataNascimento >
      dataAtual
    ) {
      setErro(
        'A data de nascimento não pode ser uma data futura.'
      );

      return;
    }

    // CNS

    const cnsLimpo =
      novoDependente.cns.replace(
        /\D/g,
        ''
      );

    if (
      cnsLimpo &&
      !/^\d{15}$/.test(cnsLimpo)
    ) {
      setErro(
        'O número do Cartão SUS (CNS) deve conter exatamente 15 dígitos numéricos.'
      );

      return;
    }

    setSalvando(true);

    try {
      // ======================================
      // USUÁRIO AUTENTICADO
      // ======================================

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        setErro(
          'Usuário não autenticado.'
        );

        return;
      }

      // ======================================
      // INSERT
      // ======================================

      const {
        error: insertError,
      } = await supabase
        .from('dependentes')
        .insert({
          usuario_id: user.id,

          nome:
            novoDependente.nome.trim(),

          parentesco:
            novoDependente.parentesco,

          data_nascimento:
            novoDependente.dataNascimento,

          cns:
            cnsLimpo || null,
        });

      if (insertError) {
        throw insertError;
      }

      // ======================================
      // LIMPAR FORMULÁRIO
      // ======================================

      setNovoDependente({
        nome: '',
        parentesco: 'Filho(a)',
        dataNascimento: '',
        cns: '',
      });

      setIsModalOpen(false);

      // ======================================
      // ATUALIZAR LISTA
      // ======================================

      await carregarDependentes();

      // Atualiza também o Layout

      window.dispatchEvent(
        new Event(
          'dependenteAtualizado'
        )
      );

    } catch (error: any) {
      console.error(
        'Erro ao cadastrar dependente:',
        error
      );

      if (error?.code === '23505') {
        setErro(
          'Já existe um dependente com esses dados.'
        );

        return;
      }

      if (error?.code === '23514') {
        setErro(
          'O CNS informado não é válido.'
        );

        return;
      }

      setErro(
        error?.message ||
        'Não foi possível cadastrar o dependente.'
      );

    } finally {
      setSalvando(false);
    }
  };

  // ==========================================
  // REMOVER DEPENDENTE
  // ==========================================

  const handleRemove = async (
    id: number
  ) => {
    const confirmar =
      window.confirm(
        'Tem certeza de que deseja remover este dependente?'
      );

    if (!confirmar) {
      return;
    }

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

      const {
        error,
      } = await supabase
        .from('dependentes')
        .delete()
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) {
        throw error;
      }

      setDependentes(
        (anteriores) =>
          anteriores.filter(
            (dependente) =>
              dependente.id !== id
          )
      );

      window.dispatchEvent(
        new Event(
          'dependenteAtualizado'
        )
      );

    } catch (error) {
      console.error(
        'Erro ao excluir dependente:',
        error
      );

      alert(
        'Não foi possível remover o dependente.'
      );

    } finally {
      setRemovendoId(null);
    }
  };

  // ==========================================
  // ABRIR CADERNETA DO DEPENDENTE
  // ==========================================

  const abrirCaderneta = (
    dependente: Dependente
  ) => {
    salvarPessoaAtiva({
      tipo: 'dependente',
      id: dependente.id,
      nome: dependente.nome,
    });

    navigate('/historico');

    window.dispatchEvent(
      new Event(
        'dependenteAtualizado'
      )
    );
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">

      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">

        {/* ================================= */}
        {/* CABEÇALHO */}
        {/* ================================= */}

        <header className="mb-8 border-b border-slate-800 pb-7">

          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">

            <Link
              to="/dashboard"
              className="hover:text-white"
            >
              EasyVacc
            </Link>

            <ChevronRight size={13} />

            <span className="text-slate-200">
              Dependentes
            </span>

          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h1 className="text-3xl font-bold tracking-tight text-white md:text-[34px]">
                Gestão de Dependentes
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Cadastre e acompanhe as
                cadernetas de vacinação da sua
                família.
              </p>

            </div>

            <button
              type="button"
              onClick={() => {
                setErro('');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00a884] px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
            >

              <UserPlus size={16} />

              Adicionar dependente

            </button>

          </div>

        </header>

        {/* ================================= */}
        {/* ERRO */}
        {/* ================================= */}

        {erro && !isModalOpen && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
            {erro}
          </div>
        )}

        {/* ================================= */}
        {/* CARREGANDO */}
        {/* ================================= */}

        {carregando ? (

          <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-400">

            <Loader2
              size={20}
              className="animate-spin text-[#00a884]"
            />

            Carregando dependentes...

          </div>

        ) : dependentes.length === 0 ? (

          /* =============================== */
          /* VAZIO */
          /* =============================== */

          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-300">

              <User size={24} />

            </div>

            <h3 className="mt-4 text-base font-semibold text-white">
              Nenhum dependente cadastrado
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Adicione filhos ou outros
              dependentes para gerenciar a
              imunização deles.
            </p>

            <button
              type="button"
              onClick={() => {
                setErro('');
                setIsModalOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#00a884] px-4 py-2 text-xs font-semibold text-slate-950"
            >

              <Plus size={14} />

              Cadastrar primeiro dependente

            </button>

          </div>

        ) : (

          /* =============================== */
          /* LISTA */
          /* =============================== */

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

            {dependentes.map(
              (dep) => (

                <div
                  key={dep.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-5"
                >

                  <div>

                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-300">

                          <User size={20} />

                        </div>

                        <div>

                          <h3 className="font-semibold text-white">
                            {dep.nome}
                          </h3>

                          <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">

                            {dep.parentesco}

                          </span>

                        </div>

                      </div>

                      <button
                        type="button"
                        disabled={
                          removendoId ===
                          dep.id
                        }
                        onClick={() =>
                          handleRemove(
                            dep.id
                          )
                        }
                        className="text-slate-500 transition hover:text-red-400 disabled:opacity-50"
                        title="Remover dependente"
                      >

                        {removendoId ===
                        dep.id ? (

                          <Loader2
                            size={16}
                            className="animate-spin"
                          />

                        ) : (

                          <Trash2
                            size={16}
                          />

                        )}

                      </button>

                    </div>

                    <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-xs">

                      <div className="flex items-center justify-between">

                        <span className="text-slate-500">
                          Nascimento:
                        </span>

                        <span className="font-medium text-slate-300">
                          {dep.dataNascimento}
                        </span>

                      </div>

                      <div className="flex items-center justify-between">

                        <span className="text-slate-500">
                          Cartão SUS:
                        </span>

                        <span className="font-medium text-slate-300">
                          {dep.cns}
                        </span>

                      </div>

                      <div className="flex items-center justify-between">

                        <span className="text-slate-500">
                          Situação:
                        </span>

                        <span className="inline-flex items-center gap-1 font-semibold text-slate-300">

                          <ShieldCheck
                            size={14}
                          />

                          {dep.statusVacinal}

                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="mt-6 border-t border-slate-800 pt-3">

                    <button
                      type="button"
                      onClick={() =>
                        abrirCaderneta(dep)
                      }
                      className="flex w-full items-center justify-between text-xs font-semibold text-slate-300 hover:text-white"
                    >

                      <span>
                        Ver caderneta do dependente
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

        {/* ================================= */}
        {/* MODAL */}
        {/* ================================= */}

        {isModalOpen && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-800 pb-4">

                <h2 className="text-lg font-bold text-white">
                  Novo Dependente
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(false)
                  }
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >

                  <X size={18} />

                </button>

              </div>

              {erro && (

                <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-300">
                  {erro}
                </div>

              )}

              <form
                onSubmit={
                  handleAddDependente
                }
                className="mt-4 space-y-4"
              >

                {/* NOME */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Nome completo
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas Sampaio"
                    value={
                      novoDependente.nome
                    }
                    onChange={(e) =>
                      setNovoDependente({
                        ...novoDependente,
                        nome:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#00a884] focus:outline-none"
                  />

                </div>

                {/* PARENTESCO */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Parentesco
                  </label>

                  <select
                    value={
                      novoDependente.parentesco
                    }
                    onChange={(e) =>
                      setNovoDependente({
                        ...novoDependente,
                        parentesco:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-[#00a884] focus:outline-none"
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

                {/* DATA */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Data de nascimento
                  </label>

                  <input
                    type="date"
                    required
                    max={
                      new Date()
                        .toISOString()
                        .split('T')[0]
                    }
                    value={
                      novoDependente.dataNascimento
                    }
                    onChange={(e) =>
                      setNovoDependente({
                        ...novoDependente,
                        dataNascimento:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-[#00a884] focus:outline-none"
                  />

                </div>

                {/* CNS */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Número do Cartão SUS (CNS)
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={15}
                    placeholder="15 dígitos"
                    value={
                      novoDependente.cns
                    }
                    onChange={(e) =>
                      setNovoDependente({
                        ...novoDependente,
                        cns:
                          e.target.value
                            .replace(
                              /\D/g,
                              ''
                            )
                            .slice(
                              0,
                              15
                            ),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#00a884] focus:outline-none"
                  />

                </div>

                {/* BOTÕES */}

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">

                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() =>
                      setIsModalOpen(false)
                    }
                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#00a884] px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
                  >

                    {salvando && (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    )}

                    {salvando
                      ? 'Salvando...'
                      : 'Salvar dependente'}

                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}