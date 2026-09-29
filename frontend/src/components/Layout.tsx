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
  Menu,
  X,
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

  // Sidebar desktop
  const [isOpen, setIsOpen] = useState(true);

  // Sidebar mobile
  const [mobileOpen, setMobileOpen] = useState(false);

  const [dependentes, setDependentes] = useState<any[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  // ==========================================
  // FECHAR MENU MOBILE
  // ==========================================

  const fecharMenuMobile = () => {
    setMobileOpen(false);
  };

  // ==========================================
  // ABRIR TITULAR
  // ==========================================

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

      window.dispatchEvent(
        new Event('pessoaAtivaAtualizada')
      );

      fecharMenuMobile();
      navigate('/dashboard');
    } catch (error) {
      console.error(
        'Erro ao abrir caderneta do titular:',
        error
      );
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

      fecharMenuMobile();
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

  // ==========================================
  // ESC FECHA MENU MOBILE
  // ==========================================

  useEffect(() => {
    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', fecharComEsc);

    return () => {
      window.removeEventListener(
        'keydown',
        fecharComEsc
      );
    };
  }, []);

  // ==========================================
  // BLOQUEAR SCROLL COM MENU MOBILE ABERTO
  // ==========================================

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // ==========================================
  // ESTILO DOS LINKS
  // ==========================================

  const estiloLink = ({
    isActive,
  }: {
    isActive: boolean;
  }) => `
    relative
    flex
    items-center
    ${isOpen ? 'gap-3 px-3' : 'lg:justify-center lg:px-0 gap-3 px-3'}
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

  // ==========================================
  // SIDEBAR
  // ==========================================

  const sidebar = (
    <>
      {/* LOGO */}
      <div
        className={`
          flex h-[76px] shrink-0 items-center border-b border-white/[0.08]
          ${
            isOpen
              ? 'justify-between px-5'
              : 'justify-between px-5 lg:justify-center lg:px-0'
          }
        `}
      >
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

          <div
            className={
              isOpen
                ? 'block'
                : 'block lg:hidden'
            }
          >
            <div className="text-[17px] font-bold tracking-tight text-white">
              Easy{' '}
              <span className="text-emerald-400">
                Vacc
              </span>
            </div>

            <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Caderneta digital
            </p>
          </div>
        </Link>

        {/* FECHAR MENU NO CELULAR */}
        <button
          type="button"
          onClick={fecharMenuMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Fechar menu"
          title="Fechar menu"
        >
          <X size={21} />
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">
        {/* VISÃO GERAL */}
        <p
          className={`
            mb-2 px-3 text-[9px] font-semibold uppercase
            tracking-[0.16em] text-slate-500
            ${isOpen ? 'block' : 'block lg:hidden'}
          `}
        >
          Visão geral
        </p>

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

            <span
              className={`
                truncate
                ${isOpen ? 'inline' : 'inline lg:hidden'}
              `}
            >
              Início
            </span>
          </NavLink>
        </div>

        {/* CADERNETA */}
        <div className="mt-6">
          <p
            className={`
              mb-2 px-3 text-[9px] font-semibold uppercase
              tracking-[0.16em] text-slate-500
              ${isOpen ? 'block' : 'block lg:hidden'}
            `}
          >
            Caderneta
          </p>

          <div className="space-y-1">
            <NavLink
              to="/historico"
              title="Vacinação"
              className={estiloLink}
              onClick={fecharMenuMobile}
            >
              <Syringe
                size={18}
                strokeWidth={1.8}
                className="shrink-0"
              />

              <span
                className={`
                  truncate
                  ${isOpen ? 'inline' : 'inline lg:hidden'}
                `}
              >
                Vacinação
              </span>
            </NavLink>

            <NavLink
              to="/certificado"
              title="Certificado"
              className={estiloLink}
              onClick={fecharMenuMobile}
            >
              <FileText
                size={18}
                strokeWidth={1.8}
                className="shrink-0"
              />

              <span
                className={`
                  truncate
                  ${isOpen ? 'inline' : 'inline lg:hidden'}
                `}
              >
                Certificado
              </span>
            </NavLink>
          </div>
        </div>

        {/* SERVIÇOS */}
        <div className="mt-6">
          <p
            className={`
              mb-2 px-3 text-[9px] font-semibold uppercase
              tracking-[0.16em] text-slate-500
              ${isOpen ? 'block' : 'block lg:hidden'}
            `}
          >
            Serviços
          </p>

          <div className="space-y-1">
            <NavLink
              to="/notificacoes"
              title="Notificações"
              className={estiloLink}
              onClick={fecharMenuMobile}
            >
              <Bell
                size={18}
                strokeWidth={1.8}
                className="shrink-0"
              />

              <div
                className={`
                  min-w-0 flex-1 items-center justify-between gap-3
                  ${
                    isOpen
                      ? 'flex'
                      : 'flex lg:hidden'
                  }
                `}
              >
                <span className="truncate">
                  Notificações
                </span>

                {notificacoesNaoLidas > 0 && (
                  <span className="flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {notificacoesNaoLidas}
                  </span>
                )}
              </div>

              {!isOpen &&
                notificacoesNaoLidas > 0 && (
                  <span className="absolute right-2 top-2 hidden h-1.5 w-1.5 rounded-full bg-emerald-400 lg:block" />
                )}
            </NavLink>

            <NavLink
              to="/campanhas"
              title="Campanhas"
              className={estiloLink}
              onClick={fecharMenuMobile}
            >
              <CalendarDays
                size={18}
                strokeWidth={1.8}
                className="shrink-0"
              />

              <span
                className={`
                  truncate
                  ${isOpen ? 'inline' : 'inline lg:hidden'}
                `}
              >
                Campanhas
              </span>
            </NavLink>

            <NavLink
              to="/postos"
              title="Postos de Saúde"
              className={estiloLink}
              onClick={fecharMenuMobile}
            >
              <MapPin
                size={18}
                strokeWidth={1.8}
                className="shrink-0"
              />

              <span
                className={`
                  truncate
                  ${isOpen ? 'inline' : 'inline lg:hidden'}
                `}
              >
                Postos de saúde
              </span>
            </NavLink>

            <NavLink
              to="/perfil"
              title="Meu Perfil"
              className={estiloLink}
              onClick={fecharMenuMobile}
            >
              <UserRound
                size={18}
                strokeWidth={1.8}
                className="shrink-0"
              />

              <span
                className={`
                  truncate
                  ${isOpen ? 'inline' : 'inline lg:hidden'}
                `}
              >
                Meu perfil
              </span>
            </NavLink>
          </div>
        </div>

        {/* DEPENDENTES */}
        <div className="mt-6">
          <div
            className={`
              mb-2 items-center justify-between px-3
              ${
                isOpen
                  ? 'flex'
                  : 'flex lg:hidden'
              }
            `}
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Dependentes
            </p>

            {dependentes.length > 0 && (
              <span className="text-[9px] font-semibold text-slate-500">
                {dependentes.length}
              </span>
            )}
          </div>

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
                    parentesco:
                      dependente.parentesco,
                  });

                  window.dispatchEvent(
                    new Event(
                      'pessoaAtivaAtualizada'
                    )
                  );

                  fecharMenuMobile();
                  navigate('/dashboard');
                }}
                className={`
                  flex h-11 w-full items-center rounded-md text-left
                  text-slate-400 transition-colors hover:bg-white/[0.06]
                  hover:text-slate-100
                  ${
                    isOpen
                      ? 'gap-3 px-3'
                      : 'gap-3 px-3 lg:justify-center lg:px-0'
                  }
                `}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-[11px] font-semibold text-slate-200">
                  {dependente.nome
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div
                  className={`
                    min-w-0
                    ${
                      isOpen
                        ? 'block'
                        : 'block lg:hidden'
                    }
                  `}
                >
                  <p className="truncate text-xs font-medium text-slate-300">
                    {dependente.nome}
                  </p>

                  <p className="mt-0.5 truncate text-[9px] text-slate-500">
                    {dependente.parentesco}
                  </p>
                </div>
              </button>
            ))}

            {dependentes.length === 0 && (
              <div
                className={`
                  px-3 py-2
                  ${
                    isOpen
                      ? 'block'
                      : 'block lg:hidden'
                  }
                `}
              >
                <p className="text-[11px] leading-5 text-slate-500">
                  Nenhum dependente cadastrado.
                </p>
              </div>
            )}

            <NavLink
              to="/adicionar-dependente"
              title="Adicionar dependente"
              className={estiloLink}
              onClick={fecharMenuMobile}
            >
              <UserPlus
                size={18}
                strokeWidth={1.8}
                className="shrink-0"
              />

              <span
                className={`
                  truncate
                  ${isOpen ? 'inline' : 'inline lg:hidden'}
                `}
              >
                Adicionar dependente
              </span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* RODAPÉ DA SIDEBAR */}
      <div className="shrink-0 border-t border-white/[0.08] p-3">
        <Link
          to="/perfil"
          onClick={fecharMenuMobile}
          className={`
            mb-2 items-center gap-3 rounded-md px-3 py-2.5
            transition-colors hover:bg-white/[0.05]
            ${
              isOpen
                ? 'flex'
                : 'flex lg:hidden'
            }
          `}
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

          <ChevronRight
            size={14}
            className="text-slate-600"
          />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          title="Sair da conta"
          className={`
            flex h-10 w-full items-center rounded-md text-slate-500
            transition-colors hover:bg-red-500/10 hover:text-red-300
            ${
              isOpen
                ? 'gap-3 px-3'
                : 'gap-3 px-3 lg:justify-center lg:px-0'
            }
          `}
        >
          <LogOut
            size={17}
            strokeWidth={1.8}
            className="shrink-0"
          />

          <span
            className={`
              text-xs font-medium
              ${isOpen ? 'inline' : 'inline lg:hidden'}
            `}
          >
            Sair da conta
          </span>
        </button>
      </div>

      {/* BOTÃO RECOLHER - SOMENTE DESKTOP */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={
          isOpen
            ? 'Recolher menu'
            : 'Expandir menu'
        }
        aria-label={
          isOpen
            ? 'Recolher menu lateral'
            : 'Expandir menu lateral'
        }
        className="
          absolute -right-3.5 top-[30px] z-40 hidden h-7 w-7
          items-center justify-center rounded-full border
          border-slate-200 bg-white text-slate-500 shadow-sm
          transition-colors hover:bg-slate-50 hover:text-slate-900
          lg:flex
        "
      >
        {isOpen ? (
          <PanelLeftClose size={14} />
        ) : (
          <PanelLeftOpen size={14} />
        )}
      </button>
    </>
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ======================================
          SIDEBAR DESKTOP / TABLET
      ====================================== */}

      <aside
        className={`
          relative z-30 hidden h-screen shrink-0 flex-col
          border-r border-[#18344d] bg-[#0b2239] text-white
          transition-[width] duration-200 ease-out print:hidden
          lg:flex
          ${
            isOpen
              ? 'lg:w-[260px]'
              : 'lg:w-[72px]'
          }
        `}
      >
        {sidebar}
      </aside>

      {/* ======================================
          FUNDO ESCURO MOBILE
      ====================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={fecharMenuMobile}
          className="
            fixed inset-0 z-40 bg-slate-950/60
            backdrop-blur-[2px] lg:hidden
          "
        />
      )}

      {/* ======================================
          SIDEBAR MOBILE
      ====================================== */}

      <aside
        id="menu-mobile"
        aria-label="Menu principal"
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw]
          flex-col border-r border-[#18344d]
          bg-[#0b2239] text-white shadow-2xl
          transition-transform duration-300 ease-out
          print:hidden lg:hidden
          ${
            mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >
        {sidebar}
      </aside>

      {/* ======================================
          ÁREA PRINCIPAL
      ====================================== */}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* CABEÇALHO MOBILE */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden print:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            aria-controls="menu-mobile"
            className="
              flex h-10 w-10 items-center justify-center
              rounded-xl border border-slate-200 bg-white
              text-slate-700 shadow-sm transition
              hover:bg-slate-50 focus:outline-none
              focus:ring-2 focus:ring-emerald-500
            "
          >
            <Menu size={22} />
          </button>

          <button
            type="button"
            onClick={() => void abrirTitular()}
            className="flex items-center gap-2"
            aria-label="Ir para o início"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0b2239]">
              <img
                src="/logo.png"
                alt=""
                className="h-7 w-7 object-contain"
              />
            </div>

            <div className="text-left">
              <p className="text-sm font-bold tracking-tight text-[#0b2239]">
                Easy{' '}
                <span className="text-emerald-600">
                  Vacc
                </span>
              </p>

              <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Caderneta digital
              </p>
            </div>
          </button>

          {/* Espaço para centralizar visualmente a logo */}
          <div
            className="h-10 w-10"
            aria-hidden="true"
          />
        </header>

        {/* CONTEÚDO */}
        <main className="relative min-w-0 flex-1 overflow-x-hidden bg-slate-50 print:overflow-visible print:bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}