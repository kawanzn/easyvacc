import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  LogOut,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Trash2,
  Loader2,
  UserPlus,
  Users,
  Pencil,
  X,
  Search,
} from 'lucide-react';

import { supabase } from '../services/supabase';

type StatusSincronizacao = {
  ultima_atualizacao: string | null;
  quantidade: number;
};


type SolicitacaoExclusao = {
  id: number;
  usuario_id: string;
  status: string;
  solicitado_em: string;
};

type ProfissionalAdmin = {
  id: number;
  user_id: string;
  nome: string;
  tipo_profissional: string;
  registro_profissional: string;
  conselho: string | null;
  estabelecimento: string | null;
  ativo: boolean;
};

type FormularioProfissional = {
  nome: string;
  email: string;
  tipo_profissional: string;
  registro_profissional: string;
  conselho: string;
  estabelecimento: string;
};

const formularioVazio: FormularioProfissional = {
  nome: '', email: '', tipo_profissional: '', registro_profissional: '',
  conselho: '', estabelecimento: '',
};

export default function PainelAdministrador() {
  const navigate = useNavigate();

  const [temaClaro, setTemaClaro] = useState(
    () => localStorage.getItem('easyvacc-tema') === 'claro'
  );

  // Mantém o tema sincronizado com as demais telas, inclusive ao voltar à aba.
  useEffect(() => {
    const sincronizarTema = () => {
      setTemaClaro(localStorage.getItem('easyvacc-tema') === 'claro');
    };
    window.addEventListener('storage', sincronizarTema);
    window.addEventListener('easyvacc-tema-atualizado', sincronizarTema);
    window.addEventListener('easyvaccTemaAtualizado', sincronizarTema);
    window.addEventListener('focus', sincronizarTema);
    return () => {
      window.removeEventListener('storage', sincronizarTema);
      window.removeEventListener('easyvacc-tema-atualizado', sincronizarTema);
      window.removeEventListener('easyvaccTemaAtualizado', sincronizarTema);
      window.removeEventListener('focus', sincronizarTema);
    };
  }, []);

  const alternarTema = () => {
    const proximo = !temaClaro;
    localStorage.setItem('easyvacc-tema', proximo ? 'claro' : 'escuro');
    setTemaClaro(proximo);
    window.dispatchEvent(new Event('easyvacc-tema-atualizado'));
    window.dispatchEvent(new Event('easyvaccTemaAtualizado'));
  };


  const [nome, setNome] =
    useState('Administrador');

  const [postos, setPostos] =
    useState<StatusSincronizacao | null>(null);

  const [campanhas, setCampanhas] =
    useState<StatusSincronizacao | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  const [solicitacoesExclusao, setSolicitacoesExclusao] =
    useState<SolicitacaoExclusao[]>([]);

  const [processandoExclusao, setProcessandoExclusao] =
    useState<number | null>(null);

  const [profissionais, setProfissionais] = useState<ProfissionalAdmin[]>([]);
  const [carregandoProfissionais, setCarregandoProfissionais] = useState(false);
  const [salvandoProfissional, setSalvandoProfissional] = useState(false);
  const [erroProfissionais, setErroProfissionais] = useState('');
  const [sucessoProfissionais, setSucessoProfissionais] = useState('');
  const [formProfissional, setFormProfissional] = useState<FormularioProfissional>(formularioVazio);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [buscaProfissional, setBuscaProfissional] = useState('');

  const chamarGestao = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('gerenciar-profissionais', { body });
    if (error) {
      // Em erros HTTP, o corpo retornado pela Edge Function contém detalhes úteis.
      const contexto = (error as { context?: Response }).context;
      if (contexto && typeof contexto.json === 'function') {
        try {
          const detalhes = await contexto.json();
          throw new Error(detalhes?.erro || error.message);
        } catch (erroLeitura) {
          if (erroLeitura instanceof Error && erroLeitura.message !== 'Unexpected end of JSON input') {
            throw erroLeitura;
          }
        }
      }
      throw error;
    }
    if (!data?.sucesso) throw new Error(data?.erro || 'Operação não concluída.');
    return data;
  };

  const carregarProfissionais = async () => {
    setCarregandoProfissionais(true);
    setErroProfissionais('');
    try {
      const resposta = await chamarGestao({ acao: 'listar' });
      setProfissionais(resposta.profissionais || []);
    } catch (error) {
      setErroProfissionais(error instanceof Error ? error.message : 'Erro ao carregar profissionais.');
    } finally {
      setCarregandoProfissionais(false);
    }
  };

  const abrirCadastro = () => {
    setEditandoId(null);
    setFormProfissional(formularioVazio);
    setMostrarFormulario(true);
    setErroProfissionais('');
    setSucessoProfissionais('');
  };

  const abrirEdicao = (p: ProfissionalAdmin) => {
    setEditandoId(p.id);
    setFormProfissional({
      nome: p.nome, email: '', tipo_profissional: p.tipo_profissional,
      registro_profissional: p.registro_profissional,
      conselho: p.conselho || '', estabelecimento: p.estabelecimento || '',
    });
    setMostrarFormulario(true);
    setErroProfissionais('');
    setSucessoProfissionais('');
  };

  const salvarProfissional = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSalvandoProfissional(true);
    setErroProfissionais('');
    setSucessoProfissionais('');
    try {
      await chamarGestao(editandoId === null
        ? { acao: 'convidar', profissional: formProfissional }
        : { acao: 'editar', id: editandoId, profissional: {
            nome: formProfissional.nome,
            tipo_profissional: formProfissional.tipo_profissional,
            registro_profissional: formProfissional.registro_profissional,
            conselho: formProfissional.conselho,
            estabelecimento: formProfissional.estabelecimento,
          } });
      setMostrarFormulario(false);
      setSucessoProfissionais(editandoId === null
        ? 'Convite enviado. O profissional deverá configurar a senha pelo e-mail.'
        : 'Dados do profissional atualizados.');
      await carregarProfissionais();
    } catch (error) {
      setErroProfissionais(error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      setSalvandoProfissional(false);
    }
  };

  const alterarStatusProfissional = async (p: ProfissionalAdmin) => {
    const texto = p.ativo ? 'desativar' : 'ativar';
    if (!window.confirm(`Deseja ${texto} o acesso profissional de ${p.nome}?`)) return;
    setErroProfissionais('');
    setSucessoProfissionais('');
    try {
      await chamarGestao({ acao: 'status', id: p.id, ativo: !p.ativo });
      setSucessoProfissionais(`Acesso de ${p.nome} ${p.ativo ? 'desativado' : 'ativado'}.`);
      await carregarProfissionais();
    } catch (error) {
      setErroProfissionais(error instanceof Error ? error.message : 'Não foi possível alterar o acesso.');
    }
  };

  const profissionaisFiltrados = profissionais.filter((p) =>
    [p.nome, p.tipo_profissional, p.registro_profissional, p.estabelecimento || '']
      .some((valor) => valor.toLocaleLowerCase('pt-BR').includes(buscaProfissional.toLocaleLowerCase('pt-BR')))
  );

  useEffect(() => {
    void carregarProfissionais();
  }, []);

  const formatarData = (
    data: string | null | undefined
  ) => {
    if (!data) {
      return 'Ainda não informado';
    }

    return new Intl.DateTimeFormat(
      'pt-BR',
      {
        dateStyle: 'short',
        timeStyle: 'medium',
      }
    ).format(new Date(data));
  };

  const carregarDados = async () => {
    setCarregando(true);
    setErro('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/admin/login', {
          replace: true,
        });
        return;
      }

      const [
        adminResult,
        postosResult,
        campanhasResult,
        exclusoesResult,
      ] = await Promise.all([
        supabase
          .from('administradores')
          .select('nome')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle(),

        supabase.rpc(
          'status_sincronizacao_postos'
        ),

        supabase.rpc(
          'status_sincronizacao_campanhas'
        ),

        supabase
          .from('solicitacoes_exclusao')
          .select('id, usuario_id, status, solicitado_em')
          .in('status', ['pendente', 'em_analise'])
          .order('solicitado_em', { ascending: true }),
      ]);

      if (adminResult.error || !adminResult.data) {
        navigate('/admin/login', { replace: true });
        throw new Error('Esta conta não possui autorização administrativa ativa.');
      }
      setNome(adminResult.data.nome || 'Administrador');

      if (postosResult.error) {
        console.error(
          'Erro ao consultar postos:',
          postosResult.error
        );

        throw new Error(
          'Não foi possível consultar a sincronização dos postos.'
        );
      }

      if (campanhasResult.error) {
        console.error(
          'Erro ao consultar campanhas:',
          campanhasResult.error
        );

        throw new Error(
          'Não foi possível consultar a sincronização das campanhas.'
        );
      }

      if (exclusoesResult.error) {
        console.error(
          'Erro ao consultar solicitações de exclusão:',
          exclusoesResult.error
        );
      } else {
        setSolicitacoesExclusao(
          (exclusoesResult.data || []) as SolicitacaoExclusao[]
        );
      }

      const dadosPostos =
        Array.isArray(postosResult.data)
          ? postosResult.data[0]
          : postosResult.data;

      const dadosCampanhas =
        Array.isArray(campanhasResult.data)
          ? campanhasResult.data[0]
          : campanhasResult.data;

      setPostos({
        ultima_atualizacao:
          dadosPostos?.ultima_atualizacao ??
          null,

        quantidade:
          Number(
            dadosPostos?.postos_ativos ?? 0
          ),
      });

      setCampanhas({
        ultima_atualizacao:
          dadosCampanhas?.ultima_atualizacao ??
          null,

        quantidade:
          Number(
            dadosCampanhas?.campanhas_ativas ??
              0
          ),
      });
    } catch (error) {
      console.error(
        'Erro no painel administrativo:',
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o painel administrativo.'
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, []);

  const processarExclusao = async (solicitacao: SolicitacaoExclusao) => {
    const confirmou = window.confirm(
      'Confirma o processamento desta exclusão? Esta ação encerrará a conta do cidadão e não poderá ser desfeita.'
    );

    if (!confirmou) return;

    setProcessandoExclusao(solicitacao.id);
    setErro('');

    try {
      const { data, error } = await supabase.functions.invoke(
        'processar-exclusao-conta',
        {
          body: { solicitacao_id: solicitacao.id },
        }
      );

      if (error) throw error;
      if (!data?.sucesso) {
        throw new Error(data?.erro || 'Não foi possível processar a exclusão.');
      }

      setSolicitacoesExclusao((atuais) =>
        atuais.filter((item) => item.id !== solicitacao.id)
      );
    } catch (error) {
      console.error('Erro ao processar exclusão:', error);
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível processar a exclusão.'
      );
    } finally {
      setProcessandoExclusao(null);
    }
  };

  const sair = async () => {
    await supabase.auth.signOut();

    navigate('/admin/login', {
      replace: true,
    });
  };

  return (
    <div className={`${temaClaro ? 'easyvacc-light ' : ''}min-h-screen bg-[#020817] text-slate-100`}>

      <style>{`
        .easyvacc-light {
          background: #f8fafc !important;
          color: #0f172a !important;
        }
        .easyvacc-light [class~="bg-[#020817]"] {
          background-color: #f8fafc !important;
        }
        .easyvacc-light [class~="bg-[#081629]"],
        .easyvacc-light [class~="bg-[#081629]/60"],
        .easyvacc-light [class~="bg-[#081629]/80"] {
          background-color: #ffffff !important;
        }
        .easyvacc-light [class~="bg-slate-800"],
        .easyvacc-light [class~="bg-slate-800/80"] {
          background-color: #f1f5f9 !important;
        }
        .easyvacc-light [class~="text-white"],
        .easyvacc-light [class~="text-slate-100"],
        .easyvacc-light [class~="text-slate-200"] {
          color: #0f172a !important;
        }
        .easyvacc-light [class~="text-slate-300"] {
          color: #334155 !important;
        }
        .easyvacc-light [class~="text-slate-400"],
        .easyvacc-light [class~="text-slate-500"] {
          color: #475569 !important;
        }
        .easyvacc-light [class~="border-slate-800"],
        .easyvacc-light [class~="border-slate-700"],
        .easyvacc-light [class~="border-slate-700/80"] {
          border-color: #cbd5e1 !important;
        }
        .easyvacc-light [class~="bg-[#020817]"] { background-color: #f3f8fe !important; }
        .easyvacc-light [class~="text-slate-300"] { color: #334155 !important; }
        .easyvacc-light [class~="text-blue-400"] { color: #126ca8 !important; }
        .easyvacc-light input,
        .easyvacc-light select,
        .easyvacc-light textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        .easyvacc-light input::placeholder,
        .easyvacc-light textarea::placeholder {
          color: #64748b !important;
        }
        .easyvacc-light input:disabled,
        .easyvacc-light select:disabled,
        .easyvacc-light textarea:disabled {
          background-color: #f1f5f9 !important;
        }
      `}</style>

      <header className="border-b border-slate-800 bg-[#081629]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500">
              <ShieldCheck size={24} />
            </div>

            <div>
              <h1 className="font-bold text-sm sm:text-base">
                Administração EasyVacc
              </h1>

              <p className="text-sm text-slate-400">
                {nome}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={alternarTema}
              aria-label={temaClaro ? 'Ativar tema escuro' : 'Ativar tema claro'}
              title={temaClaro ? 'Tema escuro' : 'Tema claro'}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${temaClaro ? 'border-[#bfd1e4] bg-[#edf5ff] text-[#126ca8] hover:bg-[#dceeff]' : 'border-[#365473] bg-[#102b49] text-[#d8ecff] hover:bg-[#173b61]'}`}
            >
              {temaClaro ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <button
              type="button"
              onClick={sair}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm transition hover:bg-slate-800 sm:px-4"
            >
              <LogOut size={17} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Painel administrativo
            </h2>

            <p className="mt-2 text-slate-400">
              Monitoramento das integrações oficiais
              do EasyVacc.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void carregarDados()
            }
            disabled={carregando}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-slate-950 transition hover:bg-blue-500 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                carregando
                  ? 'animate-spin'
                  : ''
              }
            />
            Atualizar status
          </button>
        </div>

        {erro && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300"
          >
            <AlertCircle size={20} />
            {erro}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-[#081629] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Database
                className="text-blue-500"
                size={24}
              />

              <h3 className="font-semibold">
                Postos de saúde — CNES
              </h3>
            </div>

            {carregando && !postos ? (
              <p className="text-sm text-slate-400">
                Carregando sincronização...
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 text-blue-500">
                  <CheckCircle2 size={18} />
                  <span className="font-medium">
                    Sincronização disponível
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div>
                    <span className="text-slate-400">
                      Postos ativos:
                    </span>{' '}
                    <strong>
                      {postos?.quantidade.toLocaleString(
                        'pt-BR'
                      ) ?? 0}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400">
                      Última atualização:
                    </span>{' '}
                    <strong>
                      {formatarData(
                        postos?.ultima_atualizacao
                      )}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400">
                      Fonte:
                    </span>{' '}
                    <strong>
                      CNES
                    </strong>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#081629] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Database
                className="text-blue-500"
                size={24}
              />

              <h3 className="font-semibold">
                Campanhas oficiais
              </h3>
            </div>

            {carregando && !campanhas ? (
              <p className="text-sm text-slate-400">
                Carregando sincronização...
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 text-blue-500">
                  <CheckCircle2 size={18} />
                  <span className="font-medium">
                    Sincronização disponível
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div>
                    <span className="text-slate-400">
                      Campanhas ativas:
                    </span>{' '}
                    <strong>
                      {campanhas?.quantidade ?? 0}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400">
                      Última atualização:
                    </span>{' '}
                    <strong>
                      {formatarData(
                        campanhas?.ultima_atualizacao
                      )}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400">
                      Fonte:
                    </span>{' '}
                    <strong>
                      Ministério da Saúde
                    </strong>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        <section id="gerenciar-profissionais" className="mt-6 rounded-2xl border border-slate-800 bg-[#081629] p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 shrink-0 text-blue-500" size={23} />
              <div>
                <h3 className="font-semibold">Gerenciar profissionais</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Convide profissionais autorizados e controle o acesso ao painel profissional.
                </p>
              </div>
            </div>
            <button type="button" onClick={abrirCadastro}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#126ca8] px-4 text-sm font-bold text-white hover:bg-[#105b90]">
              <UserPlus size={17} /> Novo profissional
            </button>
          </div>

          {erroProfissionais && <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{erroProfissionais}</p>}
          {sucessoProfissionais && <p role="status" className="mt-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-400">{sucessoProfissionais}</p>}

          {mostrarFormulario && (
            <form onSubmit={(event) => void salvarProfissional(event)}
              className="mt-5 rounded-2xl border border-slate-700 bg-[#020817] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="font-bold">{editandoId === null ? 'Convidar profissional' : 'Editar profissional'}</h4>
                <button type="button" aria-label="Fechar formulário" onClick={() => setMostrarFormulario(false)}
                  className="rounded-full border border-slate-700 p-2"><X size={17}/></button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ['nome', 'Nome completo'],
                  ...(editandoId === null ? [['email', 'E-mail profissional']] : []),
                  ['tipo_profissional', 'Profissão / função'],
                  ['registro_profissional', 'Registro profissional'],
                  ['conselho', 'Conselho (ex.: COREN)'],
                  ['estabelecimento', 'Unidade de saúde'],
                ] as [keyof FormularioProfissional, string][]).map(([campo, rotulo]) => (
                  <label key={campo} className="block text-sm font-semibold">
                    <span className="mb-1.5 block text-slate-300">{rotulo}</span>
                    <input
                      type={campo === 'email' ? 'email' : 'text'}
                      required={['nome', 'email', 'tipo_profissional', 'registro_profissional'].includes(campo)}
                      maxLength={campo === 'email' ? 254 : 180}
                      value={formProfissional[campo]}
                      onChange={(e) => setFormProfissional((atual) => ({ ...atual, [campo]: e.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-[#081629] px-3 py-3 text-base text-slate-100 outline-none focus:border-blue-500"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="submit" disabled={salvandoProfissional}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#126ca8] px-5 font-bold text-white disabled:opacity-50">
                  {salvandoProfissional && <Loader2 size={17} className="animate-spin" />}
                  {editandoId === null ? 'Enviar convite' : 'Salvar alterações'}
                </button>
                <button type="button" onClick={() => setMostrarFormulario(false)}
                  className="min-h-11 rounded-xl border border-slate-700 px-5 text-sm font-semibold">Cancelar</button>
              </div>
            </form>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <label className="relative block w-full sm:max-w-sm">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <span className="sr-only">Buscar profissionais</span>
              <input value={buscaProfissional} onChange={(e) => setBuscaProfissional(e.target.value)}
                placeholder="Buscar profissional ou unidade"
                className="min-h-11 w-full rounded-xl border border-slate-700 bg-[#020817] py-2 pl-10 pr-3 text-base text-slate-100" />
            </label>
            <button type="button" onClick={() => void carregarProfissionais()} disabled={carregandoProfissionais}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-semibold disabled:opacity-50">
              <RefreshCw size={16} className={carregandoProfissionais ? 'animate-spin' : ''}/> Atualizar lista
            </button>
          </div>

          {carregandoProfissionais && profissionais.length === 0 ? (
            <p className="mt-5 text-sm text-slate-400">Carregando profissionais...</p>
          ) : profissionaisFiltrados.length === 0 ? (
            <p className="mt-5 text-sm text-slate-400">Nenhum profissional encontrado.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {profissionaisFiltrados.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 p-4">
                  <div className="min-w-0">
                    <p className="font-bold">{p.nome}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {p.tipo_profissional} · {p.conselho || 'Sem conselho'} {p.registro_profissional}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{p.estabelecimento || 'Unidade não informada'}</p>
                    <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      p.ativo ? 'bg-blue-500/15 text-blue-400' : 'bg-slate-700 text-slate-300'
                    }`}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => abrirEdicao(p)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm font-semibold">
                      <Pencil size={15}/> Editar
                    </button>
                    <button type="button" onClick={() => void alterarStatusProfissional(p)}
                      className="min-h-11 rounded-xl border border-slate-700 px-3 text-sm font-semibold">
                      {p.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-[#081629] p-6">
          <div className="mb-5 flex items-center gap-3">
            <Trash2 className="text-red-400" size={22} />
            <div>
              <h3 className="font-semibold">Solicitações de exclusão</h3>
              <p className="mt-1 text-sm text-slate-400">
                Solicitações pendentes de encerramento de conta.
              </p>
            </div>
          </div>

          {solicitacoesExclusao.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nenhuma solicitação pendente.
            </p>
          ) : (
            <div className="space-y-3">
              {solicitacoesExclusao.map((solicitacao) => (
                <div
                  key={solicitacao.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#020817] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      Solicitação #{solicitacao.id}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-400">
                      Usuário: {solicitacao.usuario_id}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Solicitada em: {formatarData(solicitacao.solicitado_em)}
                    </p>
                    <p className="mt-1 text-xs text-amber-400">
                      Status: {solicitacao.status}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void processarExclusao(solicitacao)}
                    disabled={processandoExclusao === solicitacao.id}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processandoExclusao === solicitacao.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Processar exclusão
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 rounded-2xl border border-blue-600/20 bg-blue-600/5 p-5">
          <div className="flex gap-3">
            <ShieldCheck
              className="shrink-0 text-blue-500"
              size={21}
            />

            <div>
              <h3 className="font-semibold text-blue-300">
                Acesso administrativo protegido
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                O administrador acompanha rotinas
                internas e sincronizações sem receber
                acesso automático aos dados clínicos
                dos cidadãos.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}