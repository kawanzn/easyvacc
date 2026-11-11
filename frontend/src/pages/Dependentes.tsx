import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [temaClaro, setTemaClaro] = useState(() => localStorage.getItem("easyvacc-tema") === "claro");
  useEffect(() => {
    const atualizar = () => setTemaClaro(localStorage.getItem("easyvacc-tema") === "claro");
    window.addEventListener("storage", atualizar);
    window.addEventListener("easyvaccTemaAtualizado", atualizar); window.addEventListener("easyvacc-tema-atualizado", atualizar);
    return () => { window.removeEventListener("storage", atualizar); window.removeEventListener("easyvaccTemaAtualizado", atualizar); window.removeEventListener("easyvacc-tema-atualizado", atualizar); };
  }, []);

  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState<Partial<Record<'nome' | 'dataNascimento' | 'cns', string>>>({});
  const [isModalOpen, setIsModalOpen] = useState(() => searchParams.get('adicionar') === '1');
  const [cnsVisivelId, setCnsVisivelId] = useState<number | null>(null);

  // Mantém a rota antiga /adicionar-dependente compatível com o formulário atual.
  const adicionarPelaUrl = searchParams.get('adicionar') === '1';
  useEffect(() => {
    if (adicionarPelaUrl) setIsModalOpen(true);
  }, [adicionarPelaUrl]);

  const [novoDependente, setNovoDependente] = useState({
    nome: '',
    parentesco: 'Filho(a)',
    dataNascimento: '',
    cns: '',
  });

  // O menu pode indicar um dependente por ?selecionado=ID.
  // A lista de cards continua sendo a única tela; o ID apenas destaca o card.
  const idSelecionado = searchParams.get('selecionado');
  const dependenteSelecionadoId = idSelecionado && /^\d+$/.test(idSelecionado)
    ? Number(idSelecionado)
    : null;

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

    const validacao: Partial<Record<'nome' | 'dataNascimento' | 'cns', string>> = {};

    if (!novoDependente.nome.trim()) {
      validacao.nome = 'Informe o nome completo do dependente.';
    }

    if (!novoDependente.dataNascimento) {
      validacao.dataNascimento = 'Informe a data de nascimento.';
    } else {
      const hoje = new Date();
      const dataAtual = [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1).padStart(2, '0'),
        String(hoje.getDate()).padStart(2, '0'),
      ].join('-');

      if (novoDependente.dataNascimento > dataAtual) {
        validacao.dataNascimento = 'A data de nascimento não pode ser futura.';
      }
    }

    const cnsLimpo = novoDependente.cns.replace(/\D/g, '');
    if (cnsLimpo && !/^\d{15}$/.test(cnsLimpo)) {
      validacao.cns = 'Informe os 15 números do Cartão SUS ou deixe o campo vazio.';
    }

    setErrosCampos(validacao);
    if (Object.keys(validacao).length > 0) return;

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
        setErro('Sua sessão expirou. Entre novamente para cadastrar um dependente.');
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
      if (adicionarPelaUrl) setSearchParams({}, { replace: true });

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
        setErrosCampos((anteriores) => ({
          ...anteriores,
          cns: 'O Cartão SUS informado não foi aceito. Confira os números.',
        }));
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
      if (dependenteSelecionadoId === id) {
        setSearchParams({}, { replace: true });
      }

      window.dispatchEvent(
        new Event('dependenteAtualizado')
      );
    } catch (error: unknown) {
      console.error('Erro ao excluir dependente:', error);
      const codigo = error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
      setErro(codigo === '23503'
        ? 'Este dependente possui registros vinculados e não pode ser removido. O histórico deve ser preservado.'
        : 'Não foi possível remover o dependente. Tente novamente.');
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
    setErrosCampos({});

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
    setErrosCampos({});
    setIsModalOpen(false);
    if (adicionarPelaUrl) setSearchParams({}, { replace: true });
  };

  return (
    <div className={`ev-page min-h-full bg-transparent text-slate-100 ${temaClaro ? "easyvacc-light" : ""}`}>
      <style>{`
        .easyvacc-app .easyvacc-light { background: transparent !important; color: #10243e !important; }
        .easyvacc-light .text-white, .easyvacc-light .text-slate-100, .easyvacc-light .text-slate-200 { color: #10243e !important; }
        .easyvacc-light .text-slate-300 { color: #29435f !important; }
        .easyvacc-light .text-slate-400, .easyvacc-light .text-slate-500 { color: #526780 !important; }
        .easyvacc-light [class~="bg-slate-900"], .easyvacc-light [class~="bg-slate-900/60"], .easyvacc-light [class~="bg-slate-900/80"] { background-color: #fff !important; }
        .easyvacc-light [class~="bg-slate-950"], .easyvacc-light [class~="bg-slate-950/70"] { background-color: #edf3f9 !important; }
        .easyvacc-light [class~="bg-slate-800"], .easyvacc-light [class~="bg-slate-800/70"] { background-color: #e4edf7 !important; }
        .easyvacc-light [class~="border-slate-800"], .easyvacc-light [class~="border-slate-700"] { border-color: #c7d5e5 !important; }
        .easyvacc-light input, .easyvacc-light select, .easyvacc-light textarea { color: #10243e !important; background: #fff !important; border-color: #c7d5e5 !important; }
        .easyvacc-light .text-blue-400, .easyvacc-light .text-blue-300 { color: #175b96 !important; }
        .easyvacc-light .easyvacc-botao-primario { color: #fff !important; }
        .easyvacc-dependente-modal input, .easyvacc-dependente-modal select { box-sizing: border-box; min-width: 0; font-size: 16px; }
        .easyvacc-dependente-modal input[type="date"] { color-scheme: dark; min-height: 48px; }
        .easyvacc-dependente-modal input[type="date"]::-webkit-date-and-time-value { text-align: left; min-height: 1em; }
        .easyvacc-dependente-modal input[type="date"]::-webkit-calendar-picker-indicator { opacity: 1; cursor: pointer; filter: invert(1); }
        .easyvacc-dependente-modal.easyvacc-light input[type="date"] { color-scheme: light; }
        .easyvacc-dependente-modal.easyvacc-light input[type="date"]::-webkit-calendar-picker-indicator { filter: none; }
`}</style>
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">

        {/* ================================= */}
        {/* CABEÇALHO */}
        {/* ================================= */}

        <header className="ev-page-header mb-8 border-b border-slate-800 pb-7">
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
              <h1 className="ev-page-title text-3xl font-bold tracking-tight text-white md:text-[34px]">
                Meus dependentes
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Consulte os familiares vinculados à sua conta e acesse a caderneta de cada um.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirModal}
              className="ev-btn-primary easyvacc-botao-primario inline-flex items-center justify-center gap-2 rounded-lg bg-[#1769aa] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-12 text-slate-400" role="status">
            <Loader2 size={28} className="animate-spin text-blue-400" />
            <p className="mt-3 text-sm">Carregando dependentes...</p>
          </div>
        ) : erro && dependentes.length === 0 ? (
          <div className="rounded-xl border border-red-500/20 bg-slate-900 p-8 text-center">
            <p className="text-sm text-slate-300">Não foi possível mostrar seus dependentes.</p>
            <button
              type="button"
              onClick={() => void carregarDependentes()}
              className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Tentar novamente
            </button>
          </div>
        ) : dependentes.length === 0 ? (

          /* =============================== */
          /* VAZIO */
          /* =============================== */

          <div className="ev-empty-state rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-300">
              <User size={24} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-white">
              Nenhum dependente cadastrado
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Cadastre um familiar para acessar a caderneta dele pela sua conta.
              As doses de vacina não são adicionadas automaticamente.
            </p>

            <button
              type="button"
              onClick={abrirModal}
              className="ev-btn-primary easyvacc-botao-primario mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1769aa] px-4 py-2 text-xs font-semibold text-white"
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
                className={`ev-card flex flex-col justify-between rounded-xl border bg-slate-900 p-5 ${
                  dependenteSelecionadoId === dep.id
                    ? 'ev-card-selected border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-800'
                }`}
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
                        {dependenteSelecionadoId === dep.id && (
                          <span className="mt-1 inline-block rounded-md bg-blue-600/10 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                            Selecionado no menu
                          </span>
                        )}

                        <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                          {dep.parentesco}
                        </span>
                      </div>
                    </div>
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

                      <span className="text-right font-medium text-slate-300">
                        {dep.statusVacinal}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => abrirCaderneta(dep)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-600/10 px-3 py-2.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/20"
                    aria-label={`Ver caderneta de ${dep.nome}`}
                  >
                    Ver caderneta
                    <ChevronRight size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={removendoId === dep.id}
                    onClick={() => handleRemove(dep.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    aria-label={`Remover dependente ${dep.nome}`}
                  >
                    {removendoId === dep.id
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Trash2 size={15} />}
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================================= */}
        {/* MODAL */}
        {/* ================================= */}

        {isModalOpen && createPortal(
          <div
            className={`easyvacc-dependente-modal ${temaClaro ? 'easyvacc-light' : ''} fixed inset-0 z-[99999] flex min-w-0 items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-4`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-novo-dependente"
            aria-describedby="descricao-novo-dependente"
          >
            <div className="w-full min-w-0 max-w-[360px] max-h-[min(78dvh,610px)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 shadow-2xl sm:max-h-[min(85dvh,650px)] sm:px-5 sm:py-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2
                  id="titulo-novo-dependente"
                  className="text-base font-bold text-white"
                >
                  Adicionar dependente
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

              <p id="descricao-novo-dependente" className="mt-2 text-[11px] leading-4 text-slate-400">
                O dependente será vinculado à sua conta. O cadastro não registra doses de vacina.
              </p>

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
                className="mt-3 min-w-0 space-y-3"
              >
                <p className="border-b border-slate-800 pb-1 text-xs font-semibold text-slate-200">
                  Dados do dependente
                </p>
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
                    autoFocus
                    required
                    aria-invalid={Boolean(errosCampos.nome)}
                    aria-describedby={errosCampos.nome ? 'erro-dependente-nome' : undefined}
                    placeholder="Nome e sobrenome"
                    value={
                      novoDependente.nome
                    }
                    onChange={(e) => {
                      setNovoDependente((atual) => ({ ...atual, nome: e.target.value }));
                      setErrosCampos((atual) => ({ ...atual, nome: undefined }));
                    }}
                    className={`mt-1 block w-full min-w-0 max-w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none ${errosCampos.nome ? 'border-red-400 focus:border-red-400' : 'border-slate-700 focus:border-[#1769aa]'}`}
                  />
                  {errosCampos.nome && (
                    <p id="erro-dependente-nome" role="alert" className="mt-1 text-xs text-red-300">{errosCampos.nome}</p>
                  )}
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
                    className="mt-1 block w-full min-w-0 max-w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-[#1769aa] focus:outline-none"
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
                    required
                    aria-invalid={Boolean(errosCampos.dataNascimento)}
                    aria-describedby={errosCampos.dataNascimento ? 'erro-dependente-data' : undefined}
                    max={
                      new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                        .toISOString()
                        .split('T')[0]
                    }
                    value={
                      novoDependente.dataNascimento
                    }
                    onChange={(e) => {
                      setNovoDependente((atual) => ({ ...atual, dataNascimento: e.target.value }));
                      setErrosCampos((atual) => ({ ...atual, dataNascimento: undefined }));
                    }}
                    className={`mt-1 block w-full min-w-0 max-w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none ${errosCampos.dataNascimento ? 'border-red-400 focus:border-red-400' : 'border-slate-700 focus:border-[#1769aa]'}`}
                  />
                  {errosCampos.dataNascimento && (
                    <p id="erro-dependente-data" role="alert" className="mt-1 text-xs text-red-300">{errosCampos.dataNascimento}</p>
                  )}
                </div>

                <p className="border-b border-slate-800 pb-1 pt-1 text-xs font-semibold text-slate-200">
                  Identificação no SUS (opcional)
                </p>
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
                    aria-invalid={Boolean(errosCampos.cns)}
                    aria-describedby={errosCampos.cns ? 'erro-dependente-cns' : 'ajuda-dependente-cns'}
                    maxLength={15}
                    placeholder="15 dígitos"
                    value={
                      novoDependente.cns
                    }
                    onChange={(e) => {
                      const cns = e.target.value.replace(/\D/g, '').slice(0, 15);
                      setNovoDependente((atual) => ({ ...atual, cns }));
                      setErrosCampos((atual) => ({ ...atual, cns: undefined }));
                    }}
                    className={`mt-1 block w-full min-w-0 max-w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none ${errosCampos.cns ? 'border-red-400 focus:border-red-400' : 'border-slate-700 focus:border-[#1769aa]'}`}
                  />
                  {errosCampos.cns && (
                    <p id="erro-dependente-cns" role="alert" className="mt-1 text-xs text-red-300">{errosCampos.cns}</p>
                  )}

                  <p id="ajuda-dependente-cns" className="mt-1 text-[11px] leading-4 text-slate-400">
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

                <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={fecharModal}
                    className="ev-btn-secondary min-h-11 rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="ev-btn-primary easyvacc-botao-primario inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1769aa] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}