import { useState } from 'react';
import {
  Syringe,
  Calendar,
  Hash,
  Factory,
  Clock,
  ShieldAlert,
  CheckCircle,
  UserCheck,
  CreditCard,
  Search,
  Loader2,
  Users,
  LogOut,
  History,
  Pencil,
  XCircle,
  Save,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../services/supabase';

// =====================================================
// TIPOS
// =====================================================

type Paciente = {
  usuario_id: string;
  nome: string;
  cpf: string;
};

type Dependente = {
  id: number;
  nome: string;
  parentesco: string;
  data_nascimento: string | null;
};

type PessoaSelecionada =
  | {
      tipo: 'titular';
      id: string;
      nome: string;
    }
  | {
      tipo: 'dependente';
      id: number;
      nome: string;
      parentesco: string;
    };

type VacinaPaciente = {
  id: number;
  nome: string;
  data_aplicacao: string;
  lote: string | null;
  fabricante: string | null;
  proxima_dose: string | null;
  registrado_em: string | null;
  status: 'ativo' | 'corrigido' | 'cancelado';
  motivo_correcao: string | null;
  atualizado_em?: string | null;
  atualizado_por?: string | null;
};

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, '');
}

function formatarCPF(valor: string) {
  const numeros = somenteNumeros(valor).slice(0, 11);

  return numeros
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      '$1.$2.$3'
    )
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function formatarData(data: string | null) {
  if (!data) {
    return 'Não informado';
  }

  return new Date(
    `${data.substring(0, 10)}T12:00:00`
  ).toLocaleDateString('pt-BR');
}

// =====================================================
// COMPONENTE
// =====================================================

export default function PainelPosto() {
  const navigate = useNavigate();

  // ===================================================
  // PACIENTE
  // ===================================================

  const [cpfCidadao, setCpfCidadao] =
    useState('');

  const [paciente, setPaciente] =
    useState<Paciente | null>(null);

  const [dependentes, setDependentes] =
    useState<Dependente[]>([]);

  const [
    pessoaSelecionada,
    setPessoaSelecionada,
  ] = useState<PessoaSelecionada | null>(
    null
  );

  // ===================================================
  // VACINA
  // ===================================================

  const [nome, setNome] = useState('');

  const [dataAplicacao, setDataAplicacao] =
    useState('');

  const [lote, setLote] = useState('');

  const [fabricante, setFabricante] =
    useState('');

  const [proximaDose, setProximaDose] =
    useState('');

  // ===================================================
  // HISTÓRICO
  // ===================================================

  const [
    vacinasPaciente,
    setVacinasPaciente,
  ] = useState<VacinaPaciente[]>([]);

  const [
    carregandoHistorico,
    setCarregandoHistorico,
  ] = useState(false);

  // ===================================================
  // INTERFACE
  // ===================================================

  const [mensagem, setMensagem] =
    useState('');

  const [erro, setErro] =
    useState('');

  const [
    buscandoPaciente,
    setBuscandoPaciente,
  ] = useState(false);

  const [salvando, setSalvando] =
    useState(false);

  // ===================================================
  // CORREÇÃO / CANCELAMENTO
  // ===================================================

  const [vacinaEmEdicao, setVacinaEmEdicao] =
    useState<VacinaPaciente | null>(null);

  const [modoModal, setModoModal] =
    useState<'corrigir' | 'cancelar' | null>(null);

  const [motivoAlteracao, setMotivoAlteracao] =
    useState('');

  const [editNome, setEditNome] = useState('');
  const [editDataAplicacao, setEditDataAplicacao] = useState('');
  const [editLote, setEditLote] = useState('');
  const [editFabricante, setEditFabricante] = useState('');
  const [editProximaDose, setEditProximaDose] = useState('');

  const [processandoAlteracao, setProcessandoAlteracao] =
    useState(false);

  // ===================================================
  // CARREGAR HISTÓRICO
  // ===================================================

  const carregarHistorico = async (
    pessoa: PessoaSelecionada,
    usuarioId: string
  ) => {
    setCarregandoHistorico(true);

    try {
      let query = supabase
        .from('vacinas')
        .select(`
          id,
          nome,
          data_aplicacao,
          lote,
          fabricante,
          proxima_dose,
          registrado_em,
          status,
          motivo_correcao
        `)
        .eq('usuario_id', usuarioId)
        .order('data_aplicacao', {
          ascending: false,
        });

      // Dependente
      if (pessoa.tipo === 'dependente') {
        query = query.eq(
          'dependente_id',
          pessoa.id
        );
      }

      // Titular
      else {
        query = query.is(
          'dependente_id',
          null
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          'Erro ao carregar histórico:',
          error
        );

        throw error;
      }

      setVacinasPaciente(
        (data ?? []) as VacinaPaciente[]
      );
    } catch (error) {
      console.error(
        'Erro ao carregar histórico:',
        error
      );

      setVacinasPaciente([]);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  // ===================================================
  // SELECIONAR PESSOA
  // ===================================================

  const selecionarPessoa = (
    pessoa: PessoaSelecionada
  ) => {
    setPessoaSelecionada(pessoa);

    if (paciente) {
      void carregarHistorico(
        pessoa,
        paciente.usuario_id
      );
    }
  };

  // ===================================================
  // BUSCAR PACIENTE
  // ===================================================

  const buscarPaciente = async () => {
    setMensagem('');
    setErro('');

    setPaciente(null);
    setDependentes([]);
    setPessoaSelecionada(null);
    setVacinasPaciente([]);

    const cpfLimpo =
      somenteNumeros(cpfCidadao);

    if (cpfLimpo.length !== 11) {
      setErro(
        'Informe um CPF com 11 dígitos.'
      );

      return;
    }

    setBuscandoPaciente(true);

    try {
      // ===============================================
      // USUÁRIO AUTENTICADO
      // ===============================================

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          'Sua sessão expirou. Faça login novamente.'
        );
      }

      // ===============================================
      // BUSCAR TITULAR
      // ===============================================

      const {
        data: pacienteData,
        error: pacienteError,
      } = await supabase.rpc(
        'buscar_paciente_por_cpf',
        {
          cpf_busca: cpfLimpo,
        }
      );

      if (pacienteError) {
        console.error(
          'Erro ao buscar paciente:',
          pacienteError
        );

        throw new Error(
          'Não foi possível pesquisar o paciente.'
        );
      }

      const encontrado =
        pacienteData &&
        pacienteData.length > 0
          ? (pacienteData[0] as Paciente)
          : null;

      if (!encontrado) {
        setErro(
          'Cidadão não encontrado. Verifique o CPF e confirme se ele possui cadastro no EasyVacc.'
        );

        return;
      }

      setPaciente(encontrado);

      // ===============================================
      // TITULAR SELECIONADO POR PADRÃO
      // ===============================================

      const titular: PessoaSelecionada = {
        tipo: 'titular',
        id: encontrado.usuario_id,
        nome: encontrado.nome,
      };

      setPessoaSelecionada(titular);

      // ===============================================
      // DEPENDENTES
      // ===============================================

      const {
        data: dependentesData,
        error: dependentesError,
      } = await supabase.rpc(
        'buscar_dependentes_profissional',
        {
          titular_id:
            encontrado.usuario_id,
        }
      );

      if (dependentesError) {
        console.error(
          'Erro ao buscar dependentes:',
          dependentesError
        );

        throw new Error(
          'Paciente encontrado, mas não foi possível consultar os dependentes.'
        );
      }

      setDependentes(
        (dependentesData ?? []) as Dependente[]
      );

      // ===============================================
      // HISTÓRICO DO TITULAR
      // ===============================================

      await carregarHistorico(
        titular,
        encontrado.usuario_id
      );
    } catch (error) {
      console.error(
        'Erro na pesquisa do paciente:',
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível buscar o paciente.'
      );
    } finally {
      setBuscandoPaciente(false);
    }
  };

  // ===================================================
  // REGISTRAR VACINA
  // ===================================================

  const handleSalvarNoPosto = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMensagem('');
    setErro('');

    if (!paciente) {
      setErro(
        'Pesquise o CPF do cidadão antes de registrar a vacinação.'
      );

      return;
    }

    if (!pessoaSelecionada) {
      setErro(
        'Selecione quem recebeu a vacina.'
      );

      return;
    }

    if (
      !nome.trim() ||
      !dataAplicacao ||
      !lote.trim() ||
      !fabricante.trim()
    ) {
      setErro(
        'Preencha os campos obrigatórios da vacinação.'
      );

      return;
    }

    if (
      proximaDose &&
      proximaDose < dataAplicacao
    ) {
      setErro(
        'A próxima dose não pode ser anterior à data da aplicação.'
      );

      return;
    }

    setSalvando(true);

    try {
      // ===============================================
      // PROFISSIONAL AUTENTICADO
      // ===============================================

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          'Sua sessão expirou. Faça login novamente.'
        );
      }

      // ===============================================
      // REGISTRO
      // ===============================================

      const registro = {
        usuario_id:
          paciente.usuario_id,

        dependente_id:
          pessoaSelecionada.tipo ===
          'dependente'
            ? pessoaSelecionada.id
            : null,

        nome: nome.trim(),

        data_aplicacao:
          dataAplicacao,

        lote: lote.trim(),

        fabricante:
          fabricante.trim(),

        proxima_dose:
          proximaDose || null,

        registrado_por:
          user.id,

        status: 'ativo',
      };

      // ===============================================
      // INSERT
      // ===============================================

      const { error: vacinaError } =
        await supabase
          .from('vacinas')
          .insert(registro);

      if (vacinaError) {
        console.error(
          'Erro ao registrar vacina:',
          vacinaError
        );

        throw new Error(
          vacinaError.message ||
            'Não foi possível registrar a vacinação.'
        );
      }

      // ===============================================
      // SUCESSO
      // ===============================================

      setMensagem(
        `Vacinação registrada com sucesso na caderneta de ${pessoaSelecionada.nome}.`
      );

      // ===============================================
      // ATUALIZAR HISTÓRICO
      // ===============================================

      await carregarHistorico(
        pessoaSelecionada,
        paciente.usuario_id
      );

      // ===============================================
      // LIMPAR FORMULÁRIO
      // ===============================================

      setNome('');
      setDataAplicacao('');
      setLote('');
      setFabricante('');
      setProximaDose('');
    } catch (error) {
      console.error(
        'Erro ao registrar vacinação:',
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a vacinação.'
      );
    } finally {
      setSalvando(false);
    }
  };

  // ===================================================
  // CORRIGIR / CANCELAR REGISTRO
  // ===================================================

  const abrirCorrecao = (vacina: VacinaPaciente) => {
    setMensagem('');
    setErro('');
    setVacinaEmEdicao(vacina);
    setModoModal('corrigir');
    setMotivoAlteracao('');
    setEditNome(vacina.nome);
    setEditDataAplicacao(vacina.data_aplicacao?.substring(0, 10) ?? '');
    setEditLote(vacina.lote ?? '');
    setEditFabricante(vacina.fabricante ?? '');
    setEditProximaDose(vacina.proxima_dose?.substring(0, 10) ?? '');
  };

  const abrirCancelamento = (vacina: VacinaPaciente) => {
    setMensagem('');
    setErro('');
    setVacinaEmEdicao(vacina);
    setModoModal('cancelar');
    setMotivoAlteracao('');
  };

  const fecharModal = () => {
    if (processandoAlteracao) return;

    setVacinaEmEdicao(null);
    setModoModal(null);
    setMotivoAlteracao('');
    setEditNome('');
    setEditDataAplicacao('');
    setEditLote('');
    setEditFabricante('');
    setEditProximaDose('');
  };

  const salvarAlteracao = async () => {
    if (!vacinaEmEdicao || !modoModal || !paciente || !pessoaSelecionada) {
      return;
    }

    setErro('');
    setMensagem('');

    if (!motivoAlteracao.trim()) {
      setErro('Informe o motivo da correção ou do cancelamento.');
      return;
    }

    if (motivoAlteracao.trim().length < 5) {
      setErro('O motivo deve ter pelo menos 5 caracteres.');
      return;
    }

    if (modoModal === 'corrigir') {
      if (
        !editNome.trim() ||
        !editDataAplicacao ||
        !editLote.trim() ||
        !editFabricante.trim()
      ) {
        setErro('Preencha os campos obrigatórios da correção.');
        return;
      }

      if (editProximaDose && editProximaDose < editDataAplicacao) {
        setErro('A próxima dose não pode ser anterior à data da aplicação.');
        return;
      }
    }

    setProcessandoAlteracao(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Sua sessão expirou. Faça login novamente.');
      }

      const dadosAuditoria = {
        atualizado_por: user.id,
        atualizado_em: new Date().toISOString(),
        motivo_correcao: motivoAlteracao.trim(),
      };

      const atualizacao =
        modoModal === 'corrigir'
          ? {
              ...dadosAuditoria,
              nome: editNome.trim(),
              data_aplicacao: editDataAplicacao,
              lote: editLote.trim(),
              fabricante: editFabricante.trim(),
              proxima_dose: editProximaDose || null,
              status: 'corrigido',
            }
          : {
              ...dadosAuditoria,
              status: 'cancelado',
            };

      const { error: updateError } = await supabase
        .from('vacinas')
        .update(atualizacao)
        .eq('id', vacinaEmEdicao.id);

      if (updateError) {
        console.error('Erro ao atualizar vacinação:', updateError);
        throw new Error(
          updateError.message || 'Não foi possível atualizar a vacinação.'
        );
      }

      setMensagem(
        modoModal === 'corrigir'
          ? `Registro de ${vacinaEmEdicao.nome} corrigido com sucesso.`
          : `Registro de ${vacinaEmEdicao.nome} cancelado com sucesso.`
      );

      fecharModal();

      await carregarHistorico(
        pessoaSelecionada,
        paciente.usuario_id
      );
    } catch (error) {
      console.error('Erro ao alterar vacinação:', error);

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a vacinação.'
      );
    } finally {
      setProcessandoAlteracao(false);
    }
  };

  // ===================================================
  // SAIR
  // ===================================================

  const sair = async () => {
    await supabase.auth.signOut();

    navigate('/profissional/login', {
      replace: true,
    });
  };

  // ===================================================
  // JSX
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-900 p-8 font-sans text-slate-100">

      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <div className="mx-auto mb-8 flex max-w-4xl items-center justify-between border-b border-slate-800 pb-6">

        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-400">

            <ShieldAlert size={16} />

            Painel profissional
          </div>

          <h1 className="text-3xl font-black text-white">
            Portal de Vacinação
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Registro de imunizações na caderneta EasyVacc.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void sair()}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-600 hover:text-white"
        >
          <LogOut size={15} />

          Sair
        </button>
      </div>

      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-700/80 bg-slate-800/80 p-8 shadow-2xl backdrop-blur-md">

        {/* =================================================
            AVISO
        ================================================= */}

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-teal-800/50 bg-teal-950/50 p-4 text-sm text-teal-300">

          <UserCheck
            size={20}
            className="shrink-0"
          />

          <span>
            Ambiente restrito a profissionais autorizados.
            Pesquise o cidadão e selecione quem recebeu a
            vacinação.
          </span>
        </div>

        {/* =================================================
            BUSCA CPF
        ================================================= */}

        <div className="mb-7 rounded-2xl border border-slate-700 bg-slate-900/60 p-5">

          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-teal-400">
            CPF do cidadão responsável
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="relative flex-1">

              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">

                <CreditCard className="h-5 w-5 text-teal-400" />

              </div>

              <input
                type="text"
                value={cpfCidadao}
                onChange={(e) => {
                  setCpfCidadao(
                    formatarCPF(
                      e.target.value
                    )
                  );

                  if (paciente) {
                    setPaciente(null);
                    setDependentes([]);
                    setPessoaSelecionada(
                      null
                    );
                    setVacinasPaciente([]);
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter'
                  ) {
                    e.preventDefault();

                    if (
                      !buscandoPaciente
                    ) {
                      void buscarPaciente();
                    }
                  }
                }}
                maxLength={14}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3.5 pl-12 pr-4 font-mono text-lg text-white outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                placeholder="000.000.000-00"
              />

            </div>

            <button
              type="button"
              onClick={() =>
                void buscarPaciente()
              }
              disabled={
                buscandoPaciente
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {buscandoPaciente ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Buscando...
                </>
              ) : (
                <>
                  <Search size={18} />

                  Buscar
                </>
              )}

            </button>
          </div>
        </div>

        {/* =================================================
            SELEÇÃO DO PACIENTE
        ================================================= */}

        {paciente && (
          <div className="mb-7 rounded-2xl border border-slate-700 bg-slate-900/50 p-5">

            <div className="mb-4 flex items-center gap-2">

              <Users
                size={18}
                className="text-teal-400"
              />

              <h2 className="font-bold text-white">
                Selecione o paciente
              </h2>

            </div>

            <div className="space-y-3">

              {/* TITULAR */}

              <button
                type="button"
                onClick={() => {
                  const pessoa: PessoaSelecionada =
                    {
                      tipo: 'titular',
                      id: paciente.usuario_id,
                      nome: paciente.nome,
                    };

                  selecionarPessoa(
                    pessoa
                  );
                }}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  pessoaSelecionada?.tipo ===
                  'titular'
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >

                <div className="flex items-center justify-between gap-4">

                  <div>
                    <p className="font-bold text-white">
                      {paciente.nome}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Titular
                    </p>
                  </div>

                  {pessoaSelecionada?.tipo ===
                    'titular' && (
                    <CheckCircle
                      size={20}
                      className="text-teal-400"
                    />
                  )}

                </div>
              </button>

              {/* DEPENDENTES */}

              {dependentes.map(
                (dependente) => {
                  const selecionado =
                    pessoaSelecionada?.tipo ===
                      'dependente' &&
                    pessoaSelecionada.id ===
                      dependente.id;

                  return (
                    <button
                      type="button"
                      key={dependente.id}
                      onClick={() => {
                        const pessoa: PessoaSelecionada =
                          {
                            tipo: 'dependente',
                            id: dependente.id,
                            nome: dependente.nome,
                            parentesco:
                              dependente.parentesco,
                          };

                        selecionarPessoa(
                          pessoa
                        );
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selecionado
                          ? 'border-teal-500 bg-teal-500/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                    >

                      <div className="flex items-center justify-between gap-4">

                        <div>
                          <p className="font-bold text-white">
                            {
                              dependente.nome
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Dependente

                            {dependente.parentesco
                              ? ` · ${dependente.parentesco}`
                              : ''}
                          </p>
                        </div>

                        {selecionado && (
                          <CheckCircle
                            size={20}
                            className="text-teal-400"
                          />
                        )}

                      </div>
                    </button>
                  );
                }
              )}

            </div>
          </div>
        )}

        {/* =================================================
            HISTÓRICO
        ================================================= */}

        {pessoaSelecionada &&
          paciente && (
            <div className="mb-7 rounded-2xl border border-slate-700 bg-slate-900/50 p-5">

              <div className="mb-5 flex items-start gap-3">

                <div className="rounded-xl border border-teal-800/50 bg-teal-950/50 p-2.5 text-teal-400">
                  <History size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    Histórico de vacinação
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Registros de{' '}
                    <span className="font-semibold text-slate-300">
                      {
                        pessoaSelecionada.nome
                      }
                    </span>
                  </p>
                </div>
              </div>

              {carregandoHistorico ? (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-400">

                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Carregando histórico...
                </div>
              ) : vacinasPaciente.length ===
                0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 text-sm text-slate-400">

                  Nenhuma vacinação registrada
                  para esta pessoa.

                </div>
              ) : (
                <div className="space-y-3">

                  {vacinasPaciente.map(
                    (vacina) => (
                      <div
                        key={vacina.id}
                        className={`rounded-xl border p-4 ${
                          vacina.status ===
                          'cancelado'
                            ? 'border-rose-900/70 bg-rose-950/10'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >

                        <div className="flex flex-col justify-between gap-4 md:flex-row">

                          <div>

                            <div className="flex items-center gap-2">

                              <Syringe
                                size={17}
                                className="text-teal-400"
                              />

                              <p className="font-bold text-white">
                                {
                                  vacina.nome
                                }
                              </p>

                            </div>

                            <div className="mt-3 space-y-1.5 text-sm text-slate-400">

                              <p>
                                Aplicação:{' '}
                                <span className="text-slate-200">
                                  {formatarData(
                                    vacina.data_aplicacao
                                  )}
                                </span>
                              </p>

                              <p>
                                Lote:{' '}
                                <span className="text-slate-200">
                                  {vacina.lote ||
                                    'Não informado'}
                                </span>
                              </p>

                              <p>
                                Fabricante:{' '}
                                <span className="text-slate-200">
                                  {vacina.fabricante ||
                                    'Não informado'}
                                </span>
                              </p>

                              {vacina.proxima_dose && (
                                <p>
                                  Próxima dose:{' '}
                                  <span className="text-slate-200">
                                    {formatarData(
                                      vacina.proxima_dose
                                    )}
                                  </span>
                                </p>
                              )}

                            </div>
                          </div>

                          <div>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                                vacina.status ===
                                'cancelado'
                                  ? 'border-rose-800 bg-rose-950/50 text-rose-300'
                                  : vacina.status ===
                                      'corrigido'
                                    ? 'border-amber-800 bg-amber-950/50 text-amber-300'
                                    : 'border-emerald-800 bg-emerald-950/50 text-emerald-300'
                              }`}
                            >
                              {vacina.status ===
                              'cancelado'
                                ? 'Cancelado'
                                : vacina.status ===
                                    'corrigido'
                                  ? 'Corrigido'
                                  : 'Ativo'}
                            </span>

                            {vacina.status !== 'cancelado' && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => abrirCorrecao(vacina)}
                                  className="flex items-center gap-1.5 rounded-lg border border-amber-700/70 bg-amber-950/30 px-3 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-950/60"
                                >
                                  <Pencil size={14} />
                                  Corrigir
                                </button>

                                <button
                                  type="button"
                                  onClick={() => abrirCancelamento(vacina)}
                                  className="flex items-center gap-1.5 rounded-lg border border-rose-800 bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-950/60"
                                >
                                  <XCircle size={14} />
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {vacina.motivo_correcao && (
                          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-400">

                            <strong className="text-slate-300">
                              Observação:
                            </strong>{' '}

                            {
                              vacina.motivo_correcao
                            }

                          </div>
                        )}

                      </div>
                    )
                  )}

                </div>
              )}
            </div>
          )}

        {/* =================================================
            FORMULÁRIO
        ================================================= */}

        <form
          onSubmit={
            handleSalvarNoPosto
          }
          className="space-y-6"
        >

          {pessoaSelecionada && (
            <div className="rounded-xl border border-teal-800/50 bg-teal-950/30 p-4 text-sm">

              <span className="text-slate-400">
                Registrando vacinação para:{' '}
              </span>

              <strong className="text-teal-300">
                {
                  pessoaSelecionada.nome
                }
              </strong>

              <span className="ml-2 text-xs text-slate-500">
                (
                {pessoaSelecionada.tipo ===
                'dependente'
                  ? 'dependente'
                  : 'titular'}
                )
              </span>

            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* VACINA */}

            <div className="col-span-1 md:col-span-2">

              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Imunizante aplicado
              </label>

              <div className="relative">

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Syringe className="h-5 w-5 text-teal-400" />
                </div>

                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) =>
                    setNome(
                      e.target.value
                    )
                  }
                  disabled={
                    !pessoaSelecionada
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3.5 pl-12 pr-4 text-white outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Ex: Tríplice Viral, Febre Amarela, HPV..."
                />

              </div>
            </div>

            {/* DATA */}

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Data da aplicação
              </label>

              <div className="relative">

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Calendar className="h-5 w-5 text-teal-400" />
                </div>

                <input
                  type="date"
                  required
                  value={
                    dataAplicacao
                  }
                  onChange={(e) =>
                    setDataAplicacao(
                      e.target.value
                    )
                  }
                  disabled={
                    !pessoaSelecionada
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3.5 pl-12 pr-4 text-white outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                />

              </div>
            </div>

            {/* LOTE */}

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Lote do imunizante
              </label>

              <div className="relative">

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Hash className="h-5 w-5 text-teal-400" />
                </div>

                <input
                  type="text"
                  required
                  value={lote}
                  onChange={(e) =>
                    setLote(
                      e.target.value
                    )
                  }
                  disabled={
                    !pessoaSelecionada
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3.5 pl-12 pr-4 text-white outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  placeholder="Ex: LOTE-98821"
                />

              </div>
            </div>

            {/* FABRICANTE */}

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Laboratório / Fabricante
              </label>

              <div className="relative">

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Factory className="h-5 w-5 text-teal-400" />
                </div>

                <input
                  type="text"
                  required
                  value={
                    fabricante
                  }
                  onChange={(e) =>
                    setFabricante(
                      e.target.value
                    )
                  }
                  disabled={
                    !pessoaSelecionada
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3.5 pl-12 pr-4 text-white outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  placeholder="Ex: Fiocruz, Butantan, Pfizer..."
                />

              </div>
            </div>

            {/* PRÓXIMA DOSE */}

            <div>

              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Retorno / Próxima dose
              </label>

              <div className="relative">

                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Clock className="h-5 w-5 text-teal-400" />
                </div>

                <input
                  type="date"
                  value={
                    proximaDose
                  }
                  onChange={(e) =>
                    setProximaDose(
                      e.target.value
                    )
                  }
                  disabled={
                    !pessoaSelecionada
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3.5 pl-12 pr-4 text-white outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                />

              </div>
            </div>
          </div>

          {/* =================================================
              MENSAGENS
          ================================================= */}

          {mensagem && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/60 p-4 text-sm font-semibold text-emerald-400">

              <CheckCircle
                size={18}
              />

              {mensagem}

            </div>
          )}

          {erro && (
            <div className="rounded-xl border border-rose-800 bg-rose-950/60 p-4 text-sm font-semibold text-rose-400">

              {erro}

            </div>
          )}

          {/* =================================================
              BOTÃO
          ================================================= */}

          <div className="flex justify-end border-t border-slate-700 pt-4">

            <button
              type="submit"
              disabled={
                !pessoaSelecionada ||
                salvando
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-black text-slate-950 shadow-lg shadow-teal-500/10 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {salvando ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Registrando...
                </>
              ) : (
                <>
                  <Syringe
                    size={18}
                  />

                  Registrar vacinação
                </>
              )}

            </button>
          </div>

        </form>
      </div>

      {/* =================================================
          MODAL DE CORREÇÃO / CANCELAMENTO
      ================================================= */}

      {vacinaEmEdicao && modoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-400">
                  Auditoria de vacinação
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  {modoModal === 'corrigir'
                    ? 'Corrigir registro'
                    : 'Cancelar registro'}
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  {vacinaEmEdicao.nome} · {formatarData(vacinaEmEdicao.data_aplicacao)}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={processandoAlteracao}
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 transition hover:text-white disabled:opacity-50"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {modoModal === 'corrigir' && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Imunizante
                  </label>
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Data da aplicação
                  </label>
                  <input
                    type="date"
                    value={editDataAplicacao}
                    onChange={(e) => setEditDataAplicacao(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={editLote}
                    onChange={(e) => setEditLote(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Fabricante
                  </label>
                  <input
                    type="text"
                    value={editFabricante}
                    onChange={(e) => setEditFabricante(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Próxima dose
                  </label>
                  <input
                    type="date"
                    value={editProximaDose}
                    onChange={(e) => setEditProximaDose(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            {modoModal === 'cancelar' && (
              <div className="mb-5 rounded-2xl border border-rose-900/70 bg-rose-950/20 p-4 text-sm text-rose-200">
                O registro não será excluído. Ele continuará no histórico com status
                <strong> Cancelado</strong> e com a identificação do profissional responsável pela alteração.
              </div>
            )}

            <div className="mt-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Motivo {modoModal === 'corrigir' ? 'da correção' : 'do cancelamento'} *
              </label>

              <textarea
                value={motivoAlteracao}
                onChange={(e) => setMotivoAlteracao(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder={
                  modoModal === 'corrigir'
                    ? 'Explique por que este registro precisa ser corrigido...'
                    : 'Explique por que este registro precisa ser cancelado...'
                }
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-500"
              />

              <p className="mt-1 text-right text-xs text-slate-500">
                {motivoAlteracao.length}/500
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fecharModal}
                disabled={processandoAlteracao}
                className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 font-bold text-slate-300 transition hover:text-white disabled:opacity-50"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={() => void salvarAlteracao()}
                disabled={processandoAlteracao}
                className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  modoModal === 'cancelar'
                    ? 'bg-rose-500 text-white hover:bg-rose-400'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                }`}
              >
                {processandoAlteracao ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Salvando...
                  </>
                ) : modoModal === 'cancelar' ? (
                  <>
                    <XCircle size={18} />
                    Confirmar cancelamento
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar correção
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}