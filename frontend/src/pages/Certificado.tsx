import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  Syringe,
  User,
  Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../services/supabase';
import {
  lerPessoaAtiva,
  salvarPessoaAtiva,
  type PessoaAtiva,
} from '../lib/brasil';

interface Vacina {
  id: number;
  nome: string;
  data_aplicacao: string;
  lote: string | null;
  fabricante: string | null;
  dose: string | null;
  proxima_dose: string | null;
  posto: string | null;
  profissional: string | null;
}

interface Usuario {
  nome: string;
  cpf: string;
}

interface Dependente {
  id: number;
  nome: string;
  parentesco: string | null;
  data_nascimento: string | null;
}

type StatusCertificado = 'valido' | 'revogado' | 'substituido';

interface CertificadoBanco {
  id: number;
  codigo: string;
  emitido_em: string;
  versao: number;
  status: StatusCertificado;
}

function formatarData(data: string | null) {
  if (!data) return 'Não informado';

  const [ano, mes, dia] = data.substring(0, 10).split('-');

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(data: string) {
  if (!data) return 'Não informado';

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(data));
  } catch {
    return 'Não informado';
  }
}

function mascararCpf(cpf: string) {
  const digitos = cpf.replace(/\D/g, '');

  if (digitos.length !== 11) {
    return 'Não informado';
  }

  return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**`;
}

function nomeStatus(status: StatusCertificado | '') {
  if (status === 'valido') return 'Válido';
  if (status === 'substituido') return 'Substituído';
  if (status === 'revogado') return 'Revogado';
  return 'Não informado';
}

export default function Certificado() {
  const [titular, setTitular] = useState<Usuario>({
    nome: '',
    cpf: '',
  });

  const [usuario, setUsuario] = useState<Usuario>({
    nome: '',
    cpf: '',
  });

  const [usuarioId, setUsuarioId] = useState('');
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [pessoaAtiva, setPessoaAtiva] = useState<PessoaAtiva | null>(null);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [codigoCertificado, setCodigoCertificado] = useState('');
  const [emitidoEm, setEmitidoEm] = useState('');
  const [versaoCertificado, setVersaoCertificado] = useState(0);
  const [statusCertificado, setStatusCertificado] =
    useState<StatusCertificado | ''>('');
  const [emitindoNovaVersao, setEmitindoNovaVersao] = useState(false);

  const possuiVacinas = vacinas.length > 0;

  const certificadoEmitido =
    possuiVacinas &&
    Boolean(codigoCertificado) &&
    versaoCertificado > 0;

  const dataEmissao = emitidoEm
    ? formatarDataHora(emitidoEm)
    : '';

  const urlValidacao = codigoCertificado
    ? `${window.location.origin}/validar/${codigoCertificado}`
    : '';

  function limparCertificado() {
    setCodigoCertificado('');
    setEmitidoEm('');
    setVersaoCertificado(0);
    setStatusCertificado('');
  }

  async function obterOuCriarCertificado(
    dependenteId: number | null
  ) {
    const { data, error } = await supabase.rpc(
      'emitir_certificado',
      {
        p_dependente_id: dependenteId,
        p_substituir: false,
      }
    );

    if (error) {
      console.error(
        'Erro ao consultar/emitir certificado:',
        error
      );

      if (
        error.message
          ?.toLowerCase()
          .includes('sem registros de vacinação')
      ) {
        throw new Error(
          'É necessário possuir pelo menos um registro de vacinação ativo para emitir o certificado.'
        );
      }

      throw new Error(
        'Não foi possível consultar ou emitir o certificado.'
      );
    }

    if (!data || data.length === 0) {
      throw new Error(
        'Não foi possível obter o certificado.'
      );
    }

    const certificado =
      data[0] as CertificadoBanco;

    setCodigoCertificado(certificado.codigo);
    setEmitidoEm(certificado.emitido_em);
    setVersaoCertificado(certificado.versao);
    setStatusCertificado(certificado.status);
  }

  async function buscarVacinas(
    uid: string,
    dependenteId: number | null
  ) {
    let consulta = supabase
      .from('vacinas')
      .select(`
        id,
        nome,
        data_aplicacao,
        lote,
        fabricante,
        dose,
        proxima_dose,
        posto,
        profissional
      `)
      .eq('usuario_id', uid)
      .in('status', ['ativo', 'corrigido'])
      .order('data_aplicacao', {
        ascending: false,
      });

    consulta =
      dependenteId === null
        ? consulta.is('dependente_id', null)
        : consulta.eq(
            'dependente_id',
            dependenteId
          );

    const {
      data,
      error,
    } = await consulta;

    if (error) {
      console.error(
        'Erro ao buscar vacinas:',
        error
      );

      throw new Error(
        'Não foi possível carregar os registros de vacinação.'
      );
    }

    return (data ?? []) as Vacina[];
  }

  async function carregarPessoa(
    pessoa: PessoaAtiva,
    uid: string,
    dadosTitular: Usuario,
    listaDependentes: Dependente[]
  ) {
    try {
      setCarregando(true);
      setErro('');
      setVacinas([]);
      limparCertificado();

      if (pessoa.tipo === 'titular') {
        const pessoaTitular: PessoaAtiva = {
          tipo: 'titular',
          id: uid,
          nome: dadosTitular.nome,
        };

        setPessoaAtiva(pessoaTitular);

        setUsuario({
          nome: dadosTitular.nome,
          cpf: dadosTitular.cpf,
        });

        salvarPessoaAtiva(pessoaTitular);

        const lista = await buscarVacinas(
          uid,
          null
        );

        setVacinas(lista);

        if (lista.length > 0) {
          await obterOuCriarCertificado(null);
        }

        window.dispatchEvent(
          new Event('pessoaAtivaAtualizada')
        );

        return;
      }

      const dependenteId =
        Number(pessoa.id);

      if (!Number.isFinite(dependenteId)) {
        throw new Error(
          'O dependente selecionado é inválido.'
        );
      }

      const dependente =
        listaDependentes.find(
          (item) =>
            item.id === dependenteId
        );

      if (!dependente) {
        throw new Error(
          'Dependente não encontrado.'
        );
      }

      const pessoaDependente: PessoaAtiva = {
        tipo: 'dependente',
        id: dependente.id,
        nome: dependente.nome,
      };

      setPessoaAtiva(pessoaDependente);

      setUsuario({
        nome: dependente.nome,
        cpf: '',
      });

      salvarPessoaAtiva(pessoaDependente);

      const lista = await buscarVacinas(
        uid,
        dependenteId
      );

      setVacinas(lista);

      if (lista.length > 0) {
        await obterOuCriarCertificado(
          dependenteId
        );
      }

      window.dispatchEvent(
        new Event('pessoaAtivaAtualizada')
      );
    } catch (error) {
      console.error(
        'Erro ao carregar pessoa:',
        error
      );

      setVacinas([]);
      limparCertificado();

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o certificado.'
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    async function inicializar() {
      try {
        setCarregando(true);
        setErro('');

        const {
          data: { user },
          error: erroAuth,
        } = await supabase.auth.getUser();

        if (erroAuth || !user) {
          throw new Error(
            'Sua sessão expirou. Entre novamente.'
          );
        }

        setUsuarioId(user.id);

        const {
          data: dadosTitular,
          error: erroTitular,
        } = await supabase
          .from('users')
          .select('nome, cpf')
          .eq('id', user.id)
          .single();

        if (erroTitular || !dadosTitular) {
          console.error(
            'Erro ao buscar titular:',
            erroTitular
          );

          throw new Error(
            'Não foi possível carregar os dados do titular.'
          );
        }

        const titularCarregado: Usuario = {
          nome:
            dadosTitular.nome ||
            'Titular',
          cpf:
            dadosTitular.cpf ||
            '',
        };

        setTitular(titularCarregado);

        const {
          data: dadosDependentes,
          error: erroDependentes,
        } = await supabase
          .from('dependentes')
          .select(`
            id,
            nome,
            parentesco,
            data_nascimento
          `)
          .eq('usuario_id', user.id)
          .order('nome', {
            ascending: true,
          });

        if (erroDependentes) {
          console.error(
            'Erro ao buscar dependentes:',
            erroDependentes
          );

          throw new Error(
            'Não foi possível carregar os dependentes.'
          );
        }

        const listaDependentes =
          (dadosDependentes ??
            []) as Dependente[];

        setDependentes(listaDependentes);

        const salva =
          lerPessoaAtiva();

        let inicial: PessoaAtiva = {
          tipo: 'titular',
          id: user.id,
          nome: titularCarregado.nome,
        };

        if (
          salva?.tipo ===
          'dependente'
        ) {
          const existe =
            listaDependentes.find(
              (dependente) =>
                dependente.id ===
                Number(salva.id)
            );

          if (existe) {
            inicial = {
              tipo: 'dependente',
              id: existe.id,
              nome: existe.nome,
            };
          }
        }

        await carregarPessoa(
          inicial,
          user.id,
          titularCarregado,
          listaDependentes
        );
      } catch (error) {
        console.error(
          'Erro ao inicializar certificado:',
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o certificado.'
        );

        setCarregando(false);
      }
    }

    void inicializar();
  }, []);

  const selecionarTitular =
    async () => {
      if (!usuarioId) return;

      await carregarPessoa(
        {
          tipo: 'titular',
          id: usuarioId,
          nome: titular.nome,
        },
        usuarioId,
        titular,
        dependentes
      );
    };

  const selecionarDependente =
    async (
      dependente: Dependente
    ) => {
      if (!usuarioId) return;

      await carregarPessoa(
        {
          tipo: 'dependente',
          id: dependente.id,
          nome: dependente.nome,
        },
        usuarioId,
        titular,
        dependentes
      );
    };

  const emitirNovaVersao =
    async () => {
      if (
        !possuiVacinas ||
        !usuarioId ||
        !pessoaAtiva ||
        emitindoNovaVersao
      ) {
        return;
      }

      const confirmar =
        window.confirm(
          `Deseja emitir uma nova versão do certificado de ${usuario.nome}?\n\n` +
            `A versão ${versaoCertificado} será marcada como substituída e continuará disponível para validação pelo QR Code antigo.`
        );

      if (!confirmar) {
        return;
      }

      try {
        setEmitindoNovaVersao(true);
        setErro('');

        const dependenteId =
          pessoaAtiva.tipo ===
          'dependente'
            ? Number(
                pessoaAtiva.id
              )
            : null;

        if (
          dependenteId !== null &&
          !Number.isFinite(
            dependenteId
          )
        ) {
          throw new Error(
            'O dependente selecionado é inválido.'
          );
        }

        const {
          data,
          error,
        } = await supabase.rpc(
          'emitir_certificado',
          {
            p_dependente_id:
              dependenteId,
            p_substituir: true,
          }
        );

        if (error) {
          console.error(
            'Erro ao emitir nova versão:',
            error
          );

          throw new Error(
            'Não foi possível emitir uma nova versão do certificado.'
          );
        }

        if (
          !data ||
          data.length === 0
        ) {
          throw new Error(
            'A nova versão do certificado não foi retornada.'
          );
        }

        const novo =
          data[0] as CertificadoBanco;

        setCodigoCertificado(
          novo.codigo
        );

        setEmitidoEm(
          novo.emitido_em
        );

        setVersaoCertificado(
          novo.versao
        );

        setStatusCertificado(
          novo.status
        );
      } catch (error) {
        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível emitir uma nova versão do certificado.'
        );
      } finally {
        setEmitindoNovaVersao(
          false
        );
      }
    };

  const gerarPDF = () => {
    if (!certificadoEmitido) {
      return;
    }

    window.print();
  };

  if (carregando) {
    return (
      <div className="min-h-[70vh] bg-[#090d16] px-6 py-8 text-slate-100 md:px-10 md:py-10">
        <div
          className="mx-auto max-w-7xl"
          role="status"
          aria-live="polite"
          aria-label="Carregando certificado"
        >
          <span className="sr-only">Preparando certificado...</span>

          <div className="mb-7 border-b border-slate-800 pb-7" aria-hidden="true">
            <div className="h-3 w-40 animate-pulse rounded bg-slate-800/70" />
            <div className="mt-4 h-9 w-72 max-w-full animate-pulse rounded-lg bg-slate-800" />
            <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-slate-800/60" />
          </div>

          <div className="mb-7" aria-hidden="true">
            <div className="mb-3 h-4 w-36 animate-pulse rounded bg-slate-800/70" />
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 w-48 animate-pulse rounded-xl border border-slate-800 bg-[#111827]"
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4" aria-hidden="true">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl border border-slate-800 bg-[#111827]"
              />
            ))}
          </div>

          <div
            className="mt-6 overflow-hidden border border-slate-800 bg-[#111827]"
            aria-hidden="true"
          >
            <div className="h-24 animate-pulse border-b border-slate-800 bg-slate-800/40" />
            <div className="space-y-5 p-8">
              <div className="h-5 w-44 animate-pulse rounded bg-slate-800" />
              <div className="h-20 animate-pulse rounded border border-slate-800 bg-slate-900/40" />
              <div className="h-5 w-52 animate-pulse rounded bg-slate-800" />
              <div className="h-40 animate-pulse rounded border border-slate-800 bg-slate-900/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body,
          #root {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          table,
          tbody {
            page-break-inside: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="min-h-full bg-[#090d16] text-slate-100 print:min-h-0 print:overflow-visible print:bg-white print:text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10 print:max-w-none print:p-0">

        {/* CABEÇALHO */}

        <header className="mb-7 border-b border-slate-800 pb-7 print:hidden">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <span>
              Caderneta digital
            </span>

            <ChevronRight
              size={13}
            />

            <span className="text-emerald-400">
              Certificado
            </span>
          </div>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-[34px]">
                Certificado de vacinação
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Selecione o titular ou um dependente para consultar o documento individual.
              </p>
            </div>

            {certificadoEmitido && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    emitirNovaVersao
                  }
                  disabled={
                    emitindoNovaVersao
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {emitindoNovaVersao ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <FileText
                      size={17}
                    />
                  )}

                  {emitindoNovaVersao
                    ? 'Emitindo...'
                    : 'Emitir nova versão'}
                </button>

                <button
                  type="button"
                  onClick={gerarPDF}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  <Download
                    size={17}
                  />

                  Gerar PDF
                </button>
              </div>
            )}
          </div>
        </header>

        {/* SELETOR */}

        <section className="mb-7 print:hidden">
          <div className="mb-3 flex items-center gap-2">
            <Users
              size={17}
              className="text-emerald-400"
            />

            <h2 className="text-sm font-bold text-white">
              Selecione a pessoa
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={
                selecionarTitular
              }
              className={`flex min-w-[190px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                pessoaAtiva?.tipo ===
                'titular'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-800 bg-[#111827] hover:border-slate-700'
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                <User
                  size={18}
                  className={
                    pessoaAtiva?.tipo ===
                    'titular'
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {titular.nome}
                </p>

                <p className="text-[11px] text-slate-400">
                  Titular
                </p>
              </div>
            </button>

            {dependentes.map(
              (dependente) => {
                const selecionado =
                  pessoaAtiva?.tipo ===
                    'dependente' &&
                  Number(
                    pessoaAtiva.id
                  ) ===
                    dependente.id;

                return (
                  <button
                    key={
                      dependente.id
                    }
                    type="button"
                    onClick={() =>
                      selecionarDependente(
                        dependente
                      )
                    }
                    className={`flex min-w-[190px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      selecionado
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-800 bg-[#111827] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                      <User
                        size={18}
                        className={
                          selecionado
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        {
                          dependente.nome
                        }
                      </p>

                      <p className="text-[11px] text-slate-400">
                        {dependente.parentesco ||
                          'Dependente'}
                      </p>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* ERRO */}

        {erro && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 print:hidden"
          >
            {erro}
          </div>
        )}

        {/* SEM VACINAS */}

        {!erro &&
          !possuiVacinas && (
            <section className="rounded-2xl border border-amber-500/20 bg-[#111827] p-8 text-center print:hidden">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                <AlertTriangle
                  size={27}
                />
              </div>

              <h2 className="mt-5 text-xl font-bold text-white">
                Certificado indisponível
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                <strong className="text-slate-200">
                  {usuario.nome}
                </strong>{' '}
                não possui registros de vacinação ativos cadastrados no EasyVacc.
              </p>

              <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-slate-500">
                Nenhum certificado será emitido até que exista pelo menos um registro de vacinação ativo para esta pessoa.
              </p>
            </section>
          )}

        {/* CERTIFICADO */}

        {!erro &&
          possuiVacinas &&
          certificadoEmitido && (
            <>
              <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 print:border-slate-300 print:bg-white">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-amber-400 print:text-slate-700"
                  />

                  <div>
                    <p className="text-sm font-semibold text-amber-200 print:text-slate-900">
                      Documento gerado pelo EasyVacc
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400 print:text-slate-600">
                      Não substitui comprovantes, certificados ou documentos oficiais emitidos pelo Ministério da Saúde, SUS ou outros órgãos de saúde.
                    </p>
                  </div>
                </div>
              </div>

              {/* RESUMO */}

              <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 print:hidden">
                <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
                  <div className="flex items-center gap-3">
                    <FileText
                      size={19}
                      className="text-slate-400"
                    />

                    <div>
                      <p className="text-[11px] text-slate-400">
                        Documento
                      </p>

                      <p className="text-sm font-semibold text-white">
                        EasyVacc
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
                  <div className="flex items-center gap-3">
                    <Syringe
                      size={19}
                      className="text-emerald-400"
                    />

                    <div>
                      <p className="text-[11px] text-slate-400">
                        Registros
                      </p>

                      <p className="text-sm font-semibold text-white">
                        {vacinas.length}{' '}
                        {vacinas.length ===
                        1
                          ? 'vacina'
                          : 'vacinas'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={19}
                      className="text-cyan-400"
                    />

                    <div>
                      <p className="text-[11px] text-slate-400">
                        Pessoa
                      </p>

                      <p className="text-sm font-semibold text-white">
                        {pessoaAtiva?.tipo ===
                        'titular'
                          ? 'Titular'
                          : 'Dependente'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      size={19}
                      className="text-emerald-400"
                    />

                    <div>
                      <p className="text-[11px] text-slate-400">
                        Situação
                      </p>

                      <p className="text-sm font-semibold text-emerald-400">
                        {nomeStatus(
                          statusCertificado
                        )}{' '}
                        • V
                        {
                          versaoCertificado
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* DOCUMENTO */}

              <section className="mx-auto max-w-5xl overflow-hidden border border-slate-800 bg-[#111827] shadow-2xl print:max-w-none print:overflow-visible print:border-0 print:bg-white print:shadow-none">
                <div className="border-b border-slate-800 px-8 py-7 md:px-10 print:border-slate-200 print:px-0 print:pt-0">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-800 bg-white p-1.5 print:border-slate-200">
                        <img
                          src="/logo.png"
                          alt="EasyVacc"
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold text-white print:text-[#0b2239]">
                          Easy
                          <span className="text-emerald-400 print:text-emerald-600">
                            Vacc
                          </span>
                        </h2>

                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                          Caderneta digital de vacinação
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Documento
                      </p>

                      <p className="mt-1 text-sm font-bold text-white print:text-slate-900">
                        Registro de vacinação EasyVacc
                      </p>

                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 print:text-slate-700">
                        Versão{' '}
                        {
                          versaoCertificado
                        }{' '}
                        •{' '}
                        {nomeStatus(
                          statusCertificado
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-8 md:px-10 print:px-0">

                  {/* IDENTIFICAÇÃO */}

                  <section className="mb-9">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="h-4 w-1 rounded-full bg-emerald-500" />

                      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300 print:text-slate-700">
                        {pessoaAtiva?.tipo ===
                        'dependente'
                          ? 'Identificação do dependente'
                          : 'Identificação do titular'}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 border border-slate-800 md:grid-cols-[2fr_1fr] print:border-slate-200">
                      <div className="border-b border-slate-800 p-4 md:border-b-0 md:border-r print:border-slate-200">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Nome completo
                        </p>

                        <p className="mt-1.5 text-sm font-semibold text-white print:text-slate-900">
                          {usuario.nome}
                        </p>
                      </div>

                      <div className="p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {pessoaAtiva?.tipo ===
                          'dependente'
                            ? 'Identificação'
                            : 'CPF'}
                        </p>

                        <p className="mt-1.5 text-sm font-semibold text-white print:text-slate-900">
                          {pessoaAtiva?.tipo ===
                          'dependente'
                            ? 'Dependente cadastrado'
                            : mascararCpf(
                                usuario.cpf
                              )}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* VACINAS */}

                  <section>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-1 rounded-full bg-emerald-500" />

                        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300 print:text-slate-700">
                          Registros de imunização
                        </h3>
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {vacinas.length}{' '}
                        registro(s)
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 print:overflow-visible print:border-slate-200">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-slate-800 bg-[#090d16] text-[10px] font-semibold uppercase tracking-wider text-slate-400 print:border-slate-200 print:bg-white">
                            <th className="px-4 py-3">
                              Imunizante
                            </th>

                            <th className="px-4 py-3">
                              Dose
                            </th>

                            <th className="px-4 py-3">
                              Fabricante
                            </th>

                            <th className="px-4 py-3">
                              Aplicação
                            </th>

                            <th className="px-4 py-3">
                              Lote
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                          {vacinas.map(
                            (
                              vacina
                            ) => (
                              <tr
                                key={
                                  vacina.id
                                }
                              >
                                <td className="px-4 py-4 text-xs font-semibold text-white print:text-slate-900">
                                  {
                                    vacina.nome
                                  }
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-slate-300 print:text-slate-600">
                                  {vacina.dose || '—'}
                                </td>

                                <td className="px-4 py-4 text-xs text-slate-300 print:text-slate-600">
                                  {vacina.fabricante ||
                                    'Não informado'}
                                </td>

                                <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-300 print:text-slate-600">
                                  {formatarData(
                                    vacina.data_aplicacao
                                  )}
                                </td>

                                <td className="px-4 py-4 font-mono text-[11px] text-slate-400">
                                  {vacina.lote ||
                                    '—'}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* VALIDAÇÃO */}

                  <footer className="mt-10 flex flex-col justify-between gap-6 border-t border-slate-800 pt-6 sm:flex-row sm:items-end print:break-inside-avoid print:flex-row print:border-slate-200">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2">
                        <ShieldCheck
                          size={16}
                          className="text-emerald-400"
                        />

                        <p className="text-xs font-semibold text-slate-300 print:text-slate-700">
                          Validação EasyVacc
                        </p>
                      </div>

                      <p className="mt-2 text-[11px] leading-5 text-slate-400 print:text-slate-600">
                        Versão{' '}
                        {
                          versaoCertificado
                        }
                        . Emitido em{' '}
                        {dataEmissao}. Este
                        documento representa
                        os registros
                        armazenados no
                        EasyVacc no momento
                        da emissão.
                      </p>

                      <p className="mt-2 text-[11px] leading-5 text-slate-400 print:text-slate-600">
                        Situação na emissão:{' '}
                        <strong>
                          {nomeStatus(
                            statusCertificado
                          )}
                        </strong>
                        .
                      </p>

                      <p className="mt-2 break-all font-mono text-[10px] text-slate-500">
                        Código:{' '}
                        {
                          codigoCertificado
                        }
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 rounded-lg border border-slate-800 bg-white p-3 print:border-slate-300">
                      <QRCodeSVG
                        value={
                          urlValidacao
                        }
                        size={82}
                        level="M"
                        includeMargin={
                          false
                        }
                      />

                      <div className="max-w-[130px]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-900">
                          Validar documento
                        </p>

                        <p className="mt-1 text-[9px] leading-4 text-slate-600">
                          Escaneie o QR Code para consultar a validação pública no EasyVacc.
                        </p>
                      </div>
                    </div>
                  </footer>
                </div>
              </section>

              <p className="mx-auto mt-5 max-w-5xl text-center text-[11px] leading-5 text-slate-500 print:text-slate-600">
                EasyVacc — documento informativo gerado a partir dos dados registrados na plataforma. Não é um documento oficial do Ministério da Saúde ou do SUS.
              </p>
            </>
          )}
      </div>
    </div>
    </>
  );
}