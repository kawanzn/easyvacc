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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun,
} from 'lucide-react';

import { supabase } from '../services/supabase';
import { lerPessoaAtiva, salvarPessoaAtiva } from '../lib/brasil';

export default function Layout() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [temaClaro, setTemaClaro] = useState(() => {
    return localStorage.getItem('easyvacc-tema') === 'claro';
  });

  const alternarTema = () => {
    setTemaClaro((anterior) => {
      const novoTemaClaro = !anterior;
      localStorage.setItem(
        'easyvacc-tema',
        novoTemaClaro ? 'claro' : 'escuro'
      );
      return novoTemaClaro;
    });
  };

  const [dependentes, setDependentes] = useState<any[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] =
    useState(0);

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

      const { data: perfil, error: perfilError } =
        await supabase
          .from('users')
          .select('id, nome')
          .eq('id', user.id)
          .single();

      if (perfilError) {
        console.error(
          'Erro ao buscar titular:',
          perfilError
        );
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
      const { error } =
        await supabase.auth.signOut();

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

        // DEPENDENTES
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

        // NOTIFICAÇÕES
        const pessoaAtiva = lerPessoaAtiva();
        const dependenteId =
          pessoaAtiva?.tipo === 'dependente'
            ? Number(pessoaAtiva.id)
            : null;

        let queryNotificacoes = supabase
          .from('notificacoes')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('usuario_id', user.id)
          .eq('lida', false);

        if (dependenteId !== null) {
          queryNotificacoes = queryNotificacoes.eq(
            'dependente_id',
            dependenteId
          );
        } else {
          queryNotificacoes = queryNotificacoes.is(
            'dependente_id',
            null
          );
        }

        const {
          count,
          error: notificacoesError,
        } = await queryNotificacoes;

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

    window.addEventListener(
      'pessoaAtivaAtualizada',
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

      window.removeEventListener(
        'pessoaAtivaAtualizada',
        atualizarDados
      );
    };
  }, [navigate]);

  // ==========================================
  // ESC FECHA MENU MOBILE
  // ==========================================

  useEffect(() => {
    const fecharComEsc = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener(
      'keydown',
      fecharComEsc
    );

    return () => {
      window.removeEventListener(
        'keydown',
        fecharComEsc
      );
    };
  }, []);

  // ==========================================
  // BLOQUEAR SCROLL NO MOBILE
  // ==========================================

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow =
        'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // ==========================================
  // LINKS
  // ==========================================

  const estiloLink = ({
    isActive,
  }: {
    isActive: boolean;
  }) => `
    relative flex h-11 items-center rounded-xl
    text-[13px] font-medium
    transition-colors duration-150
    ${
      isOpen
        ? 'gap-3.5 px-3'
        : 'gap-3 px-3 lg:justify-center lg:px-0'
    }
    ${
      isActive
        ? temaClaro
          ? 'bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100'
          : 'bg-white/[0.09] text-white shadow-sm ring-1 ring-white/[0.06]'
        : temaClaro
          ? 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
          : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
    }
  `;

  const mostrarTexto =
    isOpen
      ? ''
      : 'lg:hidden';

  return (
    <div
      className={`easyvacc-app flex h-screen overflow-hidden font-sans ${
        temaClaro
          ? 'easyvacc-light bg-slate-50 text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >

      <style>{`

        /* Acabamento moderno do sidebar */
        #menu-principal {
          backdrop-filter: saturate(120%);
        }

        #menu-principal nav a,
        #menu-principal nav button {
          position: relative;
        }

        #menu-principal nav a[aria-current="page"]::before {
          content: '';
          position: absolute;
          left: -12px;
          top: 9px;
          bottom: 9px;
          width: 3px;
          border-radius: 0 999px 999px 0;
          background: #34d399;
        }

        .easyvacc-light #menu-principal nav a[aria-current="page"]::before {
          background: #059669;
        }

        #menu-principal nav a svg,
        #menu-principal nav button svg {
          transition: transform 160ms ease, color 160ms ease;
        }

        #menu-principal nav a:hover svg,
        #menu-principal nav button:hover svg {
          transform: translateX(1px);
        }

        /* Scrollbar discreta do menu lateral */
        .easyvacc-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.34) transparent;
        }

        .easyvacc-sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .easyvacc-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .easyvacc-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.30);
          border-radius: 999px;
        }

        .easyvacc-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.50);
        }

        .easyvacc-sidebar-scroll::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }

        .easyvacc-light .easyvacc-sidebar-scroll {
          scrollbar-color: rgba(100, 116, 139, 0.28) transparent;
        }

        .easyvacc-light .easyvacc-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.25);
        }

        .easyvacc-light .easyvacc-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.42);
        }

        html {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.34) transparent;
}

html::-webkit-scrollbar {
  width: 5px;
}

html::-webkit-scrollbar-track {
  background: transparent;
}

html::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.30);
  border-radius: 999px;
}

html::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.50);
}

html::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

        .easyvacc-light aside {
          background: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
        }

        .easyvacc-light aside .text-white,
        .easyvacc-light aside .text-slate-100,
        .easyvacc-light aside .text-slate-200,
        .easyvacc-light aside .text-slate-300 {
          color: #334155 !important;
        }

        .easyvacc-light aside .text-slate-400 {
          color: #475569 !important;
        }

        .easyvacc-light aside .text-slate-500,
        .easyvacc-light aside .text-slate-600 {
          color: #64748b !important;
        }

        .easyvacc-light aside [class~="border-white/[0.08]"] {
          border-color: #e2e8f0 !important;
        }

        .easyvacc-light aside [class~="bg-white/[0.08]"] {
          background-color: #f1f5f9 !important;
        }

        .easyvacc-light aside [class~="hover:bg-white/[0.05]"]:hover,
        .easyvacc-light aside [class~="hover:bg-white/[0.06]"]:hover,
        .easyvacc-light aside [class~="hover:bg-white/10"]:hover {
          background-color: #f1f5f9 !important;
        }

        .easyvacc-light aside .text-emerald-400,
        .easyvacc-light aside .text-emerald-500,
        .easyvacc-light aside .text-emerald-600 {
          color: #047857 !important;
        }

        .easyvacc-light aside .bg-emerald-500,
        .easyvacc-light aside .bg-emerald-600 {
          background-color: #047857 !important;
        }

        .easyvacc-light aside .bg-emerald-500.text-white,
        .easyvacc-light aside .bg-emerald-600.text-white {
          color: #ffffff !important;
        }

        .easyvacc-light main {
          background: #f8fafc !important;
          color: #0f172a;
        }

        .easyvacc-light main .bg-slate-950,
        .easyvacc-light main [class~="bg-slate-950"],
        .easyvacc-light main [class~="bg-slate-950/40"],
        .easyvacc-light main [class~="bg-slate-950/50"],
        .easyvacc-light main [class~="bg-slate-950/60"],
        .easyvacc-light main [class~="bg-slate-950/70"],
        .easyvacc-light main [class~="bg-slate-950/80"],
        .easyvacc-light main [class~="bg-slate-950/90"] {
          background-color: #f8fafc !important;
        }

        .easyvacc-light main [class~="bg-[#090d16]"] {
          background-color: #f8fafc !important;
        }

        .easyvacc-light main [class~="bg-slate-900"],
        .easyvacc-light main [class~="bg-slate-900/40"],
        .easyvacc-light main [class~="bg-slate-900/50"],
        .easyvacc-light main [class~="bg-slate-900/60"],
        .easyvacc-light main [class~="bg-slate-900/70"],
        .easyvacc-light main [class~="bg-slate-900/80"],
        .easyvacc-light main [class~="bg-slate-900/90"],
        .easyvacc-light main [class~="bg-[#0f172a]"],
        .easyvacc-light main [class~="bg-[#111827]"] {
          background-color: #ffffff !important;
        }

        .easyvacc-light main [class~="bg-slate-800"],
        .easyvacc-light main [class~="bg-slate-800/40"],
        .easyvacc-light main [class~="bg-slate-800/50"],
        .easyvacc-light main [class~="bg-slate-800/60"] {
          background-color: #f1f5f9 !important;
        }

        .easyvacc-light main .text-white,
        .easyvacc-light main .text-slate-100 {
          color: #0f172a !important;
        }

        .easyvacc-light main .text-slate-200,
        .easyvacc-light main .text-slate-300 {
          color: #334155 !important;
        }

        .easyvacc-light main .text-slate-400 {
          color: #475569 !important;
        }

        .easyvacc-light main .text-slate-500 {
          color: #64748b !important;
        }

        .easyvacc-light main .text-slate-600 {
          color: #475569 !important;
        }

        .easyvacc-light main .text-emerald-400,
        .easyvacc-light main .text-emerald-500,
        .easyvacc-light main .text-emerald-600 {
          color: #047857 !important;
        }

        .easyvacc-light main .bg-emerald-500,
        .easyvacc-light main .bg-emerald-600 {
          background-color: #047857 !important;
        }

        .easyvacc-light main .bg-emerald-500.text-white,
        .easyvacc-light main .bg-emerald-600.text-white {
          color: #ffffff !important;
        }

        .easyvacc-light main [class~="border-slate-900"],
        .easyvacc-light main [class~="border-slate-800"],
        .easyvacc-light main [class~="border-slate-800/80"],
        .easyvacc-light main [class~="border-slate-700"],
        .easyvacc-light main [class~="border-slate-600"] {
          border-color: #cbd5e1 !important;
        }

        .easyvacc-light main input,
        .easyvacc-light main select,
        .easyvacc-light main textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }

        .easyvacc-light main input::placeholder,
        .easyvacc-light main textarea::placeholder {
          color: #64748b !important;
        }

        .easyvacc-light main table {
          color: #0f172a;
        }

        .easyvacc-light main [class~="divide-slate-800"] > :not([hidden]) ~ :not([hidden]),
        .easyvacc-light main [class~="divide-slate-700"] > :not([hidden]) ~ :not([hidden]) {
          border-color: #e2e8f0 !important;
        }

        .easyvacc-light main [class~="hover:bg-slate-900"]:hover,
        .easyvacc-light main [class~="hover:bg-slate-800"]:hover {
          background-color: #f1f5f9 !important;
        }

        /* O documento do certificado mantém seu próprio desenho e impressão. */
        @media print {
          .easyvacc-app main {
            background: #ffffff !important;
            color: #0f172a !important;
          }
        }
      `}</style>
      {/* OVERLAY MOBILE */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={fecharMenuMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* ======================================
          SIDEBAR ÚNICA
      ====================================== */}

      <aside
        id="menu-principal"
        aria-label="Menu principal"
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          border-r
          ${
            temaClaro
              ? 'border-slate-200 bg-white text-slate-900'
              : 'border-[#18344d] bg-[#0b2239] text-white'
          }
          shadow-2xl
          transition-all duration-300 ease-out
          print:hidden

          lg:relative
          lg:inset-auto
          lg:z-30
          lg:shrink-0
          lg:translate-x-0
          lg:shadow-none

          ${
            mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }

          ${
            isOpen
              ? 'w-[280px] lg:w-[260px]'
              : 'w-[280px] lg:w-[72px]'
          }
        `}
      >
        {/* LOGO */}
        <div
          className={`
            flex h-[84px] shrink-0 items-center
            border-b border-white/[0.08]
            ${
              isOpen
                ? 'justify-between px-4'
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
            className="flex min-w-0 items-center gap-3.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
              <img
                src="/logo.png"
                alt="EasyVacc"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div
              className={
                isOpen
                  ? ''
                  : 'lg:hidden'
              }
            >
              <div className="whitespace-nowrap text-[18px] font-extrabold tracking-tight text-white">
                Easy{' '}
                <span className="text-emerald-400">
                  Vacc
                </span>
              </div>

              <p className="mt-0.5 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Caderneta digital
              </p>
            </div>
          </Link>

          {/* X MOBILE */}
          <button
            type="button"
            onClick={fecharMenuMobile}
            aria-label="Fechar menu"
            title="Fechar menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={21} />
          </button>
        </div>

        {/* MENU */}
        <nav className="easyvacc-sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          {/* VISÃO GERAL */}
          <p
            className={`mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 ${mostrarTexto}`}
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
                className={`truncate ${mostrarTexto}`}
              >
                Início
              </span>
            </NavLink>
          </div>

          {/* CADERNETA */}
          <div className="mt-5">
            <p
              className={`mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 ${mostrarTexto}`}
            >
              Caderneta
            </p>

            <div className="space-y-1">
              <NavLink
  to="/historico"
  title="Vacinação"
  className={estiloLink}
  onClick={async (e) => {
    e.preventDefault();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      navigate('/login');
      return;
    }

    const { data: perfil } = await supabase
      .from('users')
      .select('nome')
      .eq('id', user.id)
      .single();

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
    navigate('/historico');
  }}
>
                <Syringe
                  size={18}
                  strokeWidth={1.8}
                  className="shrink-0"
                />

                <span
                  className={`truncate ${mostrarTexto}`}
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
                  className={`truncate ${mostrarTexto}`}
                >
                  Certificado
                </span>
              </NavLink>
            </div>
          </div>

          {/* SERVIÇOS */}
          <div className="mt-5">
            <p
              className={`mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 ${mostrarTexto}`}
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
                  className={`min-w-0 flex-1 items-center justify-between gap-3 ${
                    isOpen
                      ? 'flex'
                      : 'flex lg:hidden'
                  }`}
                >
                  <span className="truncate">
                    Notificações
                  </span>

                  {notificacoesNaoLidas >
                    0 && (
                    <span className="flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {
                        notificacoesNaoLidas
                      }
                    </span>
                  )}
                </div>

                {!isOpen &&
                  notificacoesNaoLidas >
                    0 && (
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
                  className={`truncate ${mostrarTexto}`}
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
                  className={`truncate ${mostrarTexto}`}
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
                  className={`truncate ${mostrarTexto}`}
                >
                  Meu perfil
                </span>
              </NavLink>
            </div>
          </div>

          {/* DEPENDENTES */}
          <div className="mt-5">
            <div
              className={`mb-2 items-center justify-between px-3 ${
                isOpen
                  ? 'flex'
                  : 'flex lg:hidden'
              }`}
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Dependentes
              </p>

              {dependentes.length >
                0 && (
                <span className="text-[9px] font-semibold text-slate-500">
                  {dependentes.length}
                </span>
              )}
            </div>

            <div className="space-y-1">
              {dependentes.map(
                (dependente) => (
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
                      navigate(
                        '/dashboard'
                      );
                    }}
                    className={`
                      flex h-11 w-full items-center rounded-xl
                      text-left text-slate-400
                      transition-colors
                      hover:bg-white/[0.06]
                      hover:text-slate-100
                      ${
                        isOpen
                          ? 'gap-3.5 px-3'
                          : 'gap-3 px-3 lg:justify-center lg:px-0'
                      }
                    `}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-[11px] font-semibold text-slate-200">
                      {dependente.nome
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div
                      className={`min-w-0 ${mostrarTexto}`}
                    >
                      <p className="truncate text-xs font-medium text-slate-300">
                        {
                          dependente.nome
                        }
                      </p>

                      <p className="mt-0.5 truncate text-[9px] text-slate-500">
                        {
                          dependente.parentesco
                        }
                      </p>
                    </div>
                  </button>
                )
              )}

              {dependentes.length ===
                0 && (
                <div
                  className={`px-3 py-2 ${mostrarTexto}`}
                >
                  <p className="text-[11px] leading-5 text-slate-500">
                    Nenhum dependente
                    cadastrado.
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
                  className={`truncate ${mostrarTexto}`}
                >
                  Adicionar dependente
                </span>
              </NavLink>
            </div>
          </div>
        </nav>

        {/* RODAPÉ */}
        <div className="shrink-0 border-t border-white/[0.08] bg-black/[0.04] p-3">
          <Link
            to="/perfil"
            onClick={fecharMenuMobile}
            className={`mb-2 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.05] ${
              isOpen
                ? 'flex'
                : 'flex lg:hidden'
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold shadow-sm text-[#0b2239]">
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
            onClick={alternarTema}
            title={temaClaro ? 'Ativar modo escuro' : 'Ativar modo claro'}
            aria-label={temaClaro ? 'Ativar modo escuro' : 'Ativar modo claro'}
            className={`
              mb-1 flex h-10 w-full items-center rounded-xl
              text-slate-400 transition-colors
              hover:bg-white/[0.06] hover:text-slate-100
              ${
                isOpen
                  ? 'gap-3.5 px-3'
                  : 'gap-3 px-3 lg:justify-center lg:px-0'
              }
            `}
          >
            {temaClaro ? (
              <Moon size={17} strokeWidth={1.8} className="shrink-0" />
            ) : (
              <Sun size={17} strokeWidth={1.8} className="shrink-0" />
            )}

            <span className={`text-xs font-medium ${mostrarTexto}`}>
              {temaClaro ? 'Modo escuro' : 'Modo claro'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Sair da conta"
            className={`
              flex h-10 w-full items-center rounded-xl
              text-slate-500 transition-colors
              hover:bg-red-500/10
              hover:text-red-300
              ${
                isOpen
                  ? 'gap-3.5 px-3'
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
              className={`text-xs font-medium ${mostrarTexto}`}
            >
              Sair da conta
            </span>
          </button>
        </div>

        {/* RECOLHER - DESKTOP */}
        <button
          type="button"
          onClick={() =>
            setIsOpen(
              (anterior) => !anterior
            )
          }
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
          className={`
  absolute -right-3 top-[32px] z-50
  hidden h-6 w-6 items-center justify-center
  rounded-full border
  shadow-sm transition-all duration-200
  lg:flex
  ${
    temaClaro
      ? 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-emerald-500 hover:text-emerald-400'
  }
`}
        >
          {isOpen ? (
  <ChevronLeft size={13} strokeWidth={2.5} />
) : (
  <ChevronRight size={13} strokeWidth={2.5} />
)}
        </button>
      </aside>

      {/* ======================================
          CONTEÚDO
      ====================================== */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* HEADER MOBILE */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden print:hidden">
          <button
            type="button"
            onClick={() =>
              setMobileOpen(true)
            }
            aria-label="Abrir menu"
            aria-expanded={
              mobileOpen
            }
            aria-controls="menu-principal"
            className="
              flex h-10 w-10 items-center
              justify-center rounded-xl
              border border-slate-200
              bg-white text-slate-700
              shadow-sm transition
              hover:bg-slate-50
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-500
            "
          >
            <Menu size={22} />
          </button>

          <button
            type="button"
            onClick={() =>
              void abrirTitular()
            }
            className="flex items-center gap-2"
            aria-label="Ir para o início"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0b2239]">
              <img
                src="/logo.png"
                alt=""
                className="h-8 w-8 object-contain"
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

          <div
            className="h-10 w-10"
            aria-hidden="true"
          />
        </header>

        <main
          className={`relative min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden print:overflow-visible print:bg-white ${
            temaClaro ? 'bg-slate-50' : 'bg-slate-950'
          }`}
        >
  <Outlet />
</main>
      </div>
    </div>
  );
}