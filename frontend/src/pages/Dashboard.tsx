import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronRight,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  Syringe,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { lerPessoaAtiva, salvarPessoaAtiva, type PessoaAtiva } from '../lib/brasil';

type Situacao = {
  pessoa: { tipo: string; id: number; nome: string };
  origemDados: string;
  origemRotulo: string;
  sincronizadoEm: string | null;
  totalRegistros: number;
  atrasadas: { id: number; nome: string; proximaDose: string }[];
  proximaDose: { nome: string; data: string } | null;
  campanhasAplicaveis: { id: number; titulo: string; status: string }[];
  coberturaPercentual: number | null;
  coberturaDisponivel: boolean;
  status: string;
  statusRotulo: string;
  statusDetalhe: string;
  regra: string;
};

function formatarSincronizacao(iso: string | null) {
  if (!iso) return 'Ainda não houve sincronização';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return 'Data indisponível';
  return data.toLocaleString('pt-BR');
}

export default function Dashboard() {
  const [situacao, setSituacao] = useState<Situacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [pessoa, setPessoa] = useState<PessoaAtiva | null>(null);

  useEffect(() => {
    const usuarioId = localStorage.getItem('usuarioId');
    const ativa = lerPessoaAtiva();
    setPessoa(ativa);

    if (!usuarioId) {
      setCarregando(false);
      setErro('Faça login para ver a caderneta.');
      return;
    }

    const tipo = ativa?.tipo === 'dependente' ? 'dependente' : 'titular';
    fetch(`${API_URL}/api/usuarios/${usuarioId}/situacao-vacinal?pessoa=${tipo}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          const dados = data.dados as Situacao;
          setSituacao(dados);
          if (tipo === 'titular') {
            const titular = { tipo: 'titular' as const, id: dados.pessoa.id, nome: dados.pessoa.nome };
            salvarPessoaAtiva(titular);
            setPessoa(ativa?.tipo === 'dependente' ? ativa : titular);
          }
        } else {
          setErro(data.mensagem || 'Não foi possível calcular a situação vacinal.');
        }
      })
      .catch(() => setErro('Não foi possível conectar ao servidor.'))
      .finally(() => setCarregando(false));
  }, []);

  const tomStatus = useMemo(() => {
    const status = situacao?.status;
    if (status === 'em_dia') return 'emerald';
    if (status === 'atrasada') return 'amber';
    return 'slate';
  }, [situacao]);

  const coberturaTexto = situacao?.coberturaDisponivel
    ? `${situacao.coberturaPercentual}%`
    : 'Indisponível';

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-800 pb-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <span>EasyVacc</span>
              <ChevronRight size={13} />
              <span className="text-slate-200">Visão geral</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-[34px]">Visão geral</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Indicadores calculados com o histórico cadastrado, a idade informada e o esquema simplificado do calendário nacional.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/notificacoes"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300"
              title="Notificações"
            >
              <Bell size={18} />
            </Link>
            <Link to="/perfil" className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <User size={16} />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-slate-200">{pessoa?.nome || 'Minha conta'}</p>
                <p className="text-[10px] text-slate-400">{pessoa?.tipo === 'dependente' ? 'Dependente' : 'Titular'}</p>
              </div>
            </Link>
          </div>
        </header>

        {carregando && (
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="animate-spin text-[#00a884]" /> Carregando situação vacinal...
          </div>
        )}

        {erro && !carregando && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{erro}</div>
        )}

        {situacao && !carregando && (
          <>
            <section className="mb-7 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="grid lg:grid-cols-[1fr_340px]">
                <div className="p-6 md:p-8">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-200">
                    Consultando: {pessoa?.tipo === 'dependente' ? 'dependente' : 'titular'} — {pessoa?.nome || situacao.pessoa.nome}
                  </div>
                  <p className="text-sm font-medium text-slate-400">Caderneta de</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
                    {pessoa?.nome || situacao.pessoa.nome}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{situacao.statusDetalhe}</p>
                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Última sincronização: {formatarSincronizacao(situacao.sincronizadoEm)} · {situacao.origemRotulo}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/historico" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
                      <Syringe size={16} /> Consultar vacinas
                    </Link>
                    <Link to="/certificado" className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white">
                      <FileText size={16} /> Emitir certificado
                    </Link>
                  </div>
                </div>

                <div className="border-t border-slate-800 bg-slate-950/40 p-6 lg:border-l lg:border-t-0 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Situação vacinal</p>
                  <div className="mt-5 flex items-center gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${tomStatus === 'emerald' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : tomStatus === 'amber' ? 'border-amber-500/20 bg-amber-500/10 text-amber-300' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                      {tomStatus === 'amber' ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{situacao.statusRotulo}</p>
                      <p className="mt-0.5 text-xs text-slate-400">Regra: {situacao.regra.replaceAll('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="my-6 h-px bg-slate-800" />
                  <div>
                    <p className="text-xs font-medium text-slate-400">Cobertura calculada</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-white">{coberturaTexto}</p>
                    {!situacao.coberturaDisponivel && (
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        Diferente de zero: ainda não há dados suficientes para um percentual.
                      </p>
                    )}
                  </div>
                  {situacao.coberturaDisponivel && (
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${situacao.coberturaPercentual}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-base font-semibold text-white">Pendências e campanhas</h2>
              <p className="mt-1 text-xs text-slate-400">Indicadores distintos da cobertura, para não repetir o mesmo número.</p>
              <div className="mt-4 grid grid-cols-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 md:grid-cols-3">
                <div className="border-b border-slate-800 p-5 md:border-r md:border-b-0">
                  <p className="text-xs font-medium text-slate-400">Registros cadastrados</p>
                  <p className="mt-1 text-xl font-bold text-white">{situacao.totalRegistros}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{situacao.totalRegistros === 0 ? 'Nenhuma dose na base' : 'Doses encontradas neste perfil'}</p>
                </div>
                <div className="border-b border-slate-800 p-5 md:border-r md:border-b-0">
                  <p className="text-xs font-medium text-slate-400">Vacinas atrasadas</p>
                  <p className="mt-1 text-xl font-bold text-white">{situacao.atrasadas.length}</p>
                  {situacao.atrasadas[0] && (
                    <p className="mt-1 text-[11px] text-amber-300">{situacao.atrasadas[0].nome} · retorno {situacao.atrasadas[0].proximaDose}</p>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs font-medium text-slate-400">Próxima dose</p>
                  <p className="mt-1 text-base font-bold text-white">
                    {situacao.proximaDose ? `${situacao.proximaDose.nome} em ${situacao.proximaDose.data}` : 'Nenhum retorno futuro cadastrado'}
                  </p>
                </div>
              </div>
            </section>

            {situacao.campanhasAplicaveis.length > 0 && (
              <section className="mb-8 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  <CalendarDays size={16} /> Campanhas aplicáveis
                </div>
                <ul className="mt-3 space-y-1 text-sm text-slate-200">
                  {situacao.campanhasAplicaveis.map((c) => (
                    <li key={c.id}>{c.titulo} — {c.status}</li>
                  ))}
                </ul>
                <Link to="/campanhas" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300">
                  Ver campanhas <ArrowRight size={14} />
                </Link>
              </section>
            )}

            <section className="mb-8">
              <h2 className="text-base font-semibold text-white">Serviços</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { to: '/historico', icon: Syringe, t: 'Histórico de vacinação', d: 'Aplicações, lotes e próximas doses.', cor: 'emerald' },
                  { to: '/certificado', icon: FileText, t: 'Certificado', d: 'Comprovante com os registros desta base.', cor: 'blue' },
                  { to: '/postos', icon: MapPin, t: 'Postos de saúde', d: 'Unidades cadastradas na plataforma.', cor: 'cyan' },
                  { to: '/perfil', icon: User, t: 'Dados pessoais', d: 'Inclui data de nascimento para o cálculo.', cor: 'indigo' },
                ].map((s) => (
                  <Link key={s.to} to={s.to} className="group rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700">
                    <s.icon className="mb-4 text-slate-300" size={19} />
                    <h3 className="text-sm font-semibold text-white">{s.t}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{s.d}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="flex flex-col justify-between gap-5 rounded-xl border border-slate-800 bg-slate-900 p-5 md:flex-row md:items-center">
              <div>
                <h2 className="text-sm font-semibold text-white">Dependentes</h2>
                <p className="mt-1 text-xs text-slate-400">A caderneta consultada agora é a da pessoa destacada no topo.</p>
              </div>
              <Link to="/dependentes" className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300">
                Gerenciar dependentes <ArrowRight size={14} />
              </Link>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
