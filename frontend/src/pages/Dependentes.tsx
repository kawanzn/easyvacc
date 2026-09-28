import { useEffect, useState } from 'react';
import {
  ChevronRight,
  Eye,
  EyeOff,
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

  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cnsVisivelId, setCnsVisivelId] = useState<number | null>(null);

  const [novoDependente, setNovoDependente] = useState({
    nome: '',
    parentesco: 'Filho(a)',
    dataNascimento: '',
    cns: '',
  });

  // ==========================================
  // FORMATAR DATA
  // ==========================================

  const formatarData = (data: string | null) => {
    if (!data) {
      return 'Não informada';
    }

    const partes = data.substring(0, 10).split('-');

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // ==========================================
  // MASCARAR CNS
  // ==========================================

  const mascararCns = (cns: string) => {
    if (!cns || cns === 'Não informado') {
      return 'Não informado';
    }

    const somenteDigitos = cns.replace(/\D/g, '');

    if (somenteDigitos.length < 4) {
      return '••••';
    }

    return `••• •••• •••• ${somenteDigitos.slice(-4)}`;
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

      const { data, error } = await supabase
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

      const formatados: Dependente[] = (
        (data ?? []) as DependenteBanco[]
      ).map((dep) => ({
        id: dep.id,
        nome: dep.nome,
        parentesco: dep.parentesco || 'Outro',
        dataNascimento: formatarData(dep.data_nascimento),
        cns: dep.cns || 'Não informado',

        /*
         * Não inferimos situação vacinal apenas
         * pela existência do dependente.
         * A situação deve vir dos registros de vacinas.
         */
        statusVacinal: 'Consultar caderneta',
      }));

      setDependentes(formatados);
    } catch (error) {
      console.error('Erro ao buscar dependentes:', error);

      setErro(
        'Não foi possível carregar os dependentes. Tente novamente.'
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
      setErro('Informe o nome do dependente.');
      return;
    }

    // Data
    if (!novoDependente.dataNascimento) {
      setErro(
        'Informe a data de nascimento do dependente.'
      );
      return;
    }

    const dataAtual = new Date()
      .toISOString()
      .split('T')[0];

    if (novoDependente.dataNascimento > dataAtual) {
      setErro(
        'A data de nascimento não pode ser uma data futura.'
      );
      return;
    }

    // CNS
    const cnsLimpo = novoDependente.cns.replace(
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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        setErro('Usuário não autenticado.');
        return;
      }

      const { error: insertError } = await supabase
        .from('dependentes')
        .insert({
          usuario_id: user.id,
          nome: novoDependente.nome.trim(),
          parentesco: novoDependente.parentesco,
          data_nascimento:
            novoDependente.dataNascimento,
          cns: cnsLimpo || null,
        });

      if (insertError) {
        throw insertError;
      }

      setNovoDependente({
        nome: '',
        parentesco: 'Filho(a)',
        dataNascimento: '',
        cns: '',
      });

      setIsModalOpen(false);

      await carregarDependentes();

      window.dispatchEvent(
        new Event('dependenteAtualizado')
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
        'Não foi possível cadastrar o dependente. Verifique os dados e tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  };

  // ==========================================
  // REMOVER DEPENDENTE
  // ==========================================

  const handleRemove = async (id: number) => {
    const dependente = dependentes.find(
      (dep) => dep.id === id
    );

    const confirmar = window.confirm(
      dependente
        ? `Tem certeza de que deseja remover ${dependente.nome}?`
        : 'Tem certeza de que deseja remover este dependente?'
    );

    if (!confirmar) {
      return;
    }

    setRemovendoId(id);
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
          (dependente) => dependente.id !== id
        )
      );

      if (cnsVisivelId === id) {
        setCnsVisivelId(null);
      }

      window.dispatchEvent(
        new Event('dependenteAtualizado')
      );
    } catch (error) {
      console.error(
        'Erro ao excluir dependente:',
        error
      );

      setErro(
        'Não foi possível remover o dependente. Tente novamente.'
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

    /*
     * A Carteira/Histórico já escuta este evento.
     */
    window.dispatchEvent(
      new Event('pessoaAtivaAtualizada')
    );

    navigate('/historico');
  };

  // ==========================================
  // ABRIR MODAL
  // ==========================================

  const abrirModal = () => {
    setErro('');

    setNovoDependente({
      nome: '',
      parentesco: 'Filho(a)',
      dataNascimento: '',
      cns: '',
    });

    setIsModalOpen(true);
  };

  const fecharModal = () => {
    if (salvando) {
      return;
    }

    setErro('');
    setIsModalOpen(false);
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
                Cadastre e acompanhe as cadernetas
                de vacinação da sua família.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirModal}
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
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300"
          >
            {erro}
          </div>
        )}

        {/* ================================= */}
        {/* CARREGANDO */}
        {/* ================================= */}

        {carregando ? (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            aria-label="Carregando dependentes"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-xl border border-slate-800 bg-slate-900"
              >
                <div className="p-5">
                  <div className="mb-5 h-10 w-10 rounded-lg bg-slate-800" />
                  <div className="mb-3 h-4 w-1/2 rounded bg-slate-800" />
                  <div className="h-3 w-1/3 rounded bg-slate-800/70" />
                </div>
              </div>
            ))}
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
              Adicione filhos ou outros dependentes
              para gerenciar a imunização deles.
            </p>

            <button
              type="button"
              onClick={abrirModal}
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
            {dependentes.map((dep) => (
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
                        removendoId === dep.id
                      }
                      onClick={() =>
                        handleRemove(dep.id)
                      }
                      className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      title="Remover dependente"
                      aria-label={`Remover dependente ${dep.nome}`}
                    >
                      {removendoId === dep.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-slate-800 pt-4 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">
                        Nascimento:
                      </span>

                      <span className="font-medium text-slate-300">
                        {dep.dataNascimento}
                      </span>
                    </div>

                    {/* CNS MASCARADO */}

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">
                        Cartão SUS:
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-slate-300">
                          {cnsVisivelId === dep.id
                            ? dep.cns
                            : mascararCns(dep.cns)}
                        </span>

                        {dep.cns !==
                          'Não informado' && (
                          <button
                            type="button"
                            onClick={() =>
                              setCnsVisivelId(
                                (atual) =>
                                  atual === dep.id
                                    ? null
                                    : dep.id
                              )
                            }
                            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                            aria-label={
                              cnsVisivelId ===
                              dep.id
                                ? `Ocultar CNS de ${dep.nome}`
                                : `Mostrar CNS de ${dep.nome}`
                            }
                            title={
                              cnsVisivelId ===
                              dep.id
                                ? 'Ocultar CNS'
                                : 'Mostrar CNS'
                            }
                          >
                            {cnsVisivelId ===
                            dep.id ? (
                              <EyeOff
                                size={14}
                              />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
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
            ))}
          </div>
        )}

        {/* ================================= */}
        {/* MODAL */}
        {/* ================================= */}

        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-novo-dependente"
          >
            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2
                  id="titulo-novo-dependente"
                  className="text-lg font-bold text-white"
                >
                  Novo Dependente
                </h2>

                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={salvando}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                  aria-label="Fechar formulário de dependente"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {erro && (
                <div
                  role="alert"
                  className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-300"
                >
                  {erro}
                </div>
              )}

              <form
                onSubmit={
                  handleAddDependente
                }
                noValidate
                className="mt-4 space-y-4"
              >
                {/* NOME */}

                <div>
                  <label
                    htmlFor="dependente-nome"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Nome completo
                    <span className="ml-1 text-red-400">
                      *
                    </span>
                  </label>

                  <input
                    id="dependente-nome"
                    type="text"
                    autoComplete="name"
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
                  <label
                    htmlFor="dependente-parentesco"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Parentesco
                    <span className="ml-1 text-red-400">
                      *
                    </span>
                  </label>

                  <select
                    id="dependente-parentesco"
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
                  <label
                    htmlFor="dependente-data-nascimento"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Data de nascimento
                    <span className="ml-1 text-red-400">
                      *
                    </span>
                  </label>

                  <input
                    id="dependente-data-nascimento"
                    type="date"
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
                  <label
                    htmlFor="dependente-cns"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Número do Cartão SUS (CNS)
                  </label>

                  <input
                    id="dependente-cns"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
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

                  <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
                    Opcional. Caso informado,
                    deve conter exatamente 15
                    dígitos. O número ficará
                    mascarado na visualização.
                  </p>
                </div>

                <p className="text-[11px] text-slate-500">
                  <span className="text-red-400">
                    *
                  </span>{' '}
                  Campos obrigatórios
                </p>

                {/* BOTÕES */}

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={fecharModal}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#00a884] px-4 py-2 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
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