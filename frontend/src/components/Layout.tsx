import { useEffect, useState } from 'react';
import {
  NavLink,
  Outlet,
  Link,
  useNavigate,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Syringe,
  FileText,
  UserRound,
  LogOut,
  UserPlus,
  Bell,
  CalendarDays,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { salvarPessoaAtiva } from '../lib/brasil';

/*
  ============================================================
  LAYOUT PRINCIPAL - EASYVACC
  ============================================================
*/

export default function Layout() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(true);
  const [dependentes, setDependentes] = useState<any[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const abrirTitular = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('Usuário não autenticado:', error);
      navigate('/login');
      return;
    }

    // Busca o nome real do titular
    const { data: perfil, error: perfilError } = await supabase
      .from('users')
      .select('id, nome')
      .eq('id', user.id)
      .single();

    if (perfilError) {
      console.error('Erro ao buscar titular:', perfilError);
    }

    salvarPessoaAtiva({
      tipo: 'titular',
      id: user.id,
      nome:
        perfil?.nome ||
        user.user_metadata?.nome ||
        'Titular',
    });

    // Avisa os componentes que a pessoa ativa mudou
    window.dispatchEvent(
      new Event('pessoaAtivaAtualizada')
    );

    navigate('/dashboard');
  } catch (error) {
    console.error('Erro ao abrir caderneta do titular:', error);
  }
};

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Erro ao sair:', error);
      }
    } finally {
      localStorage.removeItem('usuarioId');
      localStorage.removeItem('pessoaAtiva');

      navigate('/');
    }
  };

  // ==========================================
  // CARREGAR DADOS
  // ==========================================
  useEffect(() => {
    let ativo = true;

    const carregarDados = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error(
            'Usuário não autenticado:',
            userError
          );

          localStorage.removeItem('usuarioId');
          navigate('/login');
          return;
        }

        localStorage.setItem(
          'usuarioId',
          user.id
        );

        // ======================================
        // DEPENDENTES
        // ======================================

        const {
          data: dadosDependentes,
          error: dependentesError,
        } = await supabase
          .from('dependentes')
          .select('*')
          .eq('usuario_id', user.id)
          .order('nome', {
            ascending: true,
          });

        if (dependentesError) {
          console.error(
            'Erro ao buscar dependentes:',
            dependentesError
          );
        } else if (ativo) {
          setDependentes(
            dadosDependentes ?? []
          );
        }

        // ======================================
        // NOTIFICAÇÕES
        // ======================================

        const {
          count,
          error: notificacoesError,
        } = await supabase
          .from('notificacoes')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('usuario_id', user.id)
          .eq('lida', false);

        if (notificacoesError) {
          console.error(
            'Erro ao buscar notificações:',
            notificacoesError
          );
        } else if (ativo) {
          setNotificacoesNaoLidas(
            count ?? 0
          );
        }
      } catch (error) {
        console.error(
          'Erro ao carregar dados do Layout:',
          error
        );
      }
    };

    const atualizarDados = () => {
      void carregarDados();
    };

    void carregarDados();

    window.addEventListener(
      'dependenteAtualizado',
      atualizarDados
    );

    window.addEventListener(
      'notificacaoAtualizada',
      atualizarDados
    );

    return () => {
      ativo = false;

      window.removeEventListener(
        'dependenteAtualizado',
        atualizarDados
      );

      window.removeEventListener(
        'notificacaoAtualizada',
        atualizarDados
      );
    };
  }, [navigate]);

  // ESTILO DOS LINKS
  const estiloLink = ({ isActive }: { isActive: boolean }) => `
    relative
    flex
    items-center
    ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'}
    h-10
    rounded-md
    text-[13px]
    font-medium
    transition-colors
    duration-150
    ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
    }
  `;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside
        className={`
          relative z-30 flex shrink-0 flex-col border-r border-[#18344d] bg-[#0b2239] text-white
          transition-[width] duration-200 ease-out print:hidden
          ${isOpen ? 'w-[260px]' : 'w-[72px]'}
        `}
      >
        {/* LOGO */}
        <div
          className={`flex h-[76px] shrink-0 items-center border-b border-white/[0.08] ${
            isOpen ? 'justify-between px-5' : 'justify-center'
          }`}
        >
          {isOpen ? (
            <Link
  to="/dashboard"
  onClick={(e) => {
    e.preventDefault();
    void abrirTitular();
  }}
  className="flex items-center gap-3"
>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white">
                <img
                  src="/logo.png"
                  alt="EasyVacc"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div>
                <div className="text-[17px] font-bold tracking-tight text-white">
                  Easy <span className="text-emerald-400">Vacc</span>
                </div>
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Caderneta digital
                </p>
              </div>
            </Link>
          ) : (
            <Link
  to="/dashboard"
  title="EasyVacc"
  onClick={(e) => {
    e.preventDefault();
    void abrirTitular();
  }}
  className="flex h-9 w-9 items-center justify-center rounded-md bg-white"
>
              <img
                src="/logo.png"
                alt="EasyVacc"
                className="h-7 w-7 object-contain"
              />
            </Link>
          )}
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">
          {/* VISÃO GERAL */}
          {isOpen && (
            <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Visão geral
            </p>
          )}
          <div className="space-y-1">
           <NavLink
  to="/dashboard"
  title="Início"
  className={estiloLink}
  onClick={(e) => {
    e.preventDefault();
    void abrirTitular();
  }}
>
  <LayoutDashboard
    size={18}
    strokeWidth={1.8}
    className="shrink-0"
  />

  {isOpen && (
    <span className="truncate">
      Início
    </span>
  )}
</NavLink>
          </div>

          {/* CADERNETA */}
          <div className="mt-6">
            {isOpen && (
              <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Caderneta
              </p>
            )}
            <div className="space-y-1">
              <NavLink to="/historico" title="Vacinação" className={estiloLink}>
                <Syringe size={18} strokeWidth={1.8} className="shrink-0" />
                {isOpen && <span className="truncate">Vacinação</span>}
              </NavLink>

              <NavLink to="/certificado" title="Certificado" className={estiloLink}>
                <FileText size={18} strokeWidth={1.8} className="shrink-0" />
                {isOpen && <span className="truncate">Certificado</span>}
              </NavLink>
            </div>
          </div>

          {/* SERVIÇOS */}
          <div className="mt-6">
            {isOpen && (
              <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Serviços
              </p>
            )}
            <div className="space-y-1">
              <NavLink to="/notificacoes" title="Notificações" className={estiloLink}>
                <Bell size={18} strokeWidth={1.8} className="shrink-0" />
                {isOpen && (
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <span className="truncate">Notificações</span>
                    {notificacoesNaoLidas > 0 && (
                      <span className="flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {notificacoesNaoLidas}
                      </span>
                    )}
                  </div>
                )}
                {!isOpen && notificacoesNaoLidas > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </NavLink>

              <NavLink to="/campanhas" title="Campanhas" className={estiloLink}>
                <CalendarDays size={18} strokeWidth={1.8} className="shrink-0" />
                {isOpen && <span className="truncate">Campanhas</span>}
              </NavLink>

              <NavLink to="/postos" title="Postos de Saúde" className={estiloLink}>
                <MapPin size={18} strokeWidth={1.8} className="shrink-0" />
                {isOpen && <span className="truncate">Postos de saúde</span>}
              </NavLink>

              <NavLink to="/perfil" title="Meu Perfil" className={estiloLink}>
                <UserRound size={18} strokeWidth={1.8} className="shrink-0" />
                {isOpen && <span className="truncate">Meu perfil</span>}
              </NavLink>
            </div>
          </div>

          {/* DEPENDENTES */}
          <div className="mt-6">
            {isOpen && (
              <div className="mb-2 flex items-center justify-between px-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Dependentes
                </p>
                {dependentes.length > 0 && (
                  <span className="text-[9px] font-semibold text-slate-500">
                    {dependentes.length}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-1">
             {dependentes.map((dependente) => (
  <button
    type="button"
    key={dependente.id}
    title={`Consultar caderneta de ${dependente.nome}`}
    onClick={() => {
      salvarPessoaAtiva({
        tipo: 'dependente',
        id: dependente.id,
        nome: dependente.nome,
        parentesco: dependente.parentesco,
      });

      window.dispatchEvent(
        new Event('pessoaAtivaAtualizada')
      );

      navigate('/dashboard');
    }}
    className={`
      flex h-11 w-full items-center text-left rounded-md
      text-slate-400 hover:bg-white/[0.06]
      ${isOpen ? 'gap-3 px-3' : 'justify-center'}
    `}
  >
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-[11px] font-semibold text-slate-200">
      {dependente.nome?.charAt(0).toUpperCase()}
    </div>

    {isOpen && (
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-300">
          {dependente.nome}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-slate-500">
          {dependente.parentesco}
        </p>
      </div>
    )}
  </button>
))}

              {dependentes.length === 0 && isOpen && (
                <div className="px-3 py-2">
                  <p className="text-[11px] leading-5 text-slate-500">
                    Nenhum dependente cadastrado.
                  </p>
                </div>
              )}

              <NavLink to="/adicionar-dependente" title="Adicionar dependente" className={estiloLink}>
                <UserPlus size={18} strokeWidth={1.8} className="shrink-0" />
                {isOpen && <span className="truncate">Adicionar dependente</span>}
              </NavLink>
            </div>
          </div>
        </nav>

        {/* RODAPÉ DA SIDEBAR */}
        <div className="shrink-0 border-t border-white/[0.08] p-3">
          {isOpen && (
            <Link
              to="/perfil"
              className="mb-2 flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-xs font-bold text-[#0b2239]">
                JV
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">
                  João Victor
                </p>
                <p className="mt-0.5 truncate text-[9px] text-slate-500">
                  Conta pessoal
                </p>
              </div>
              <ChevronRight size={14} className="text-slate-600" />
            </Link>
          )}

          <button
  type="button"
  onClick={handleLogout}
  title="Sair da conta"
  className={`
    flex h-10 w-full items-center rounded-md text-slate-500
    transition-colors hover:bg-red-500/10 hover:text-red-300
    ${isOpen ? 'gap-3 px-3' : 'justify-center'}
  `}
>
  <LogOut
    size={17}
    strokeWidth={1.8}
    className="shrink-0"
  />

  {isOpen && (
    <span className="text-xs font-medium">
      Sair da conta
    </span>
  )}
</button>
        </div>

        {/* BOTÃO DE RECOLHER */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Recolher menu' : 'Expandir menu'}
          className="
            absolute -right-3.5 top-[30px] z-40 flex h-7 w-7 items-center justify-center rounded-full
            border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900
          "
        >
          {isOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="relative flex-1 overflow-y-auto bg-slate-50 print:overflow-visible print:bg-white">
        <Outlet />
      </main>
    </div>
  );
}