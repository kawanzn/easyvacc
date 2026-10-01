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
} from 'lucide-react';

import { supabase } from '../services/supabase';

type StatusSincronizacao = {
  ultima_atualizacao: string | null;
  quantidade: number;
};

export default function PainelAdministrador() {
  const navigate = useNavigate();

  const [temaClaro, setTemaClaro] = useState(
    () => localStorage.getItem('easyvacc-tema') === 'claro'
  );

  const alternarTema = () => {
    setTemaClaro((atual) => {
      const novoTemaClaro = !atual;
      localStorage.setItem(
        'easyvacc-tema',
        novoTemaClaro ? 'claro' : 'escuro'
      );
      return novoTemaClaro;
    });
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
      ]);

      if (adminResult.data?.nome) {
        setNome(adminResult.data.nome);
      }

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

  const sair = async () => {
    await supabase.auth.signOut();

    navigate('/admin/login', {
      replace: true,
    });
  };

  return (
    <div className={`${temaClaro ? 'easyvacc-light ' : ''}min-h-screen bg-slate-950 text-slate-100`}>

      <style>{`
        .easyvacc-light {
          background: #f8fafc !important;
          color: #0f172a !important;
        }
        .easyvacc-light [class~="bg-slate-950"] {
          background-color: #f8fafc !important;
        }
        .easyvacc-light [class~="bg-slate-900"],
        .easyvacc-light [class~="bg-slate-900/60"],
        .easyvacc-light [class~="bg-slate-900/80"] {
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

      <button
        type="button"
        onClick={alternarTema}
        aria-label={temaClaro ? 'Ativar tema escuro' : 'Ativar tema claro'}
        title={temaClaro ? 'Tema escuro' : 'Tema claro'}
        className="fixed right-4 top-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-lg transition hover:border-teal-500 hover:text-teal-400"
      >
        {temaClaro ? <Moon size={19} /> : <Sun size={19} />}
      </button>

      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
              <ShieldCheck size={24} />
            </div>

            <div>
              <h1 className="font-bold">
                Administração EasyVacc
              </h1>

              <p className="text-sm text-slate-400">
                {nome}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={sair}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800"
          >
            <LogOut size={17} />
            Sair
          </button>
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
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-teal-400 disabled:opacity-50"
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
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Database
                className="text-teal-400"
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
                <div className="flex items-center gap-2 text-emerald-400">
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

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Database
                className="text-teal-400"
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
                <div className="flex items-center gap-2 text-emerald-400">
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

        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex gap-3">
            <ShieldCheck
              className="shrink-0 text-emerald-400"
              size={21}
            />

            <div>
              <h3 className="font-semibold text-emerald-300">
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