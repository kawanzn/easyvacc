import './easyvacc-mobile.css';
import { useEffect, useState, type MouseEvent } from 'react';
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
    // Uma única fonte de verdade: evita alternância dupla por eventos concorrentes.
    const proximo = localStorage.getItem('easyvacc-tema') !== 'claro';
    localStorage.setItem('easyvacc-tema', proximo ? 'claro' : 'escuro');
    setTemaClaro(proximo);
    window.dispatchEvent(new Event('easyvacc-tema-atualizado'));
    window.dispatchEvent(new Event('easyvaccTemaAtualizado'));
  };

  useEffect(() => {
    const sincronizarTema = () => {
      setTemaClaro(localStorage.getItem('easyvacc-tema') === 'claro');
    };
    window.addEventListener('storage', sincronizarTema);
    window.addEventListener('easyvacc-tema-atualizado', sincronizarTema);
    window.addEventListener('easyvaccTemaAtualizado', sincronizarTema);
    return () => {
      window.removeEventListener('storage', sincronizarTema);
      window.removeEventListener('easyvacc-tema-atualizado', sincronizarTema);
      window.removeEventListener('easyvaccTemaAtualizado', sincronizarTema);
    };
  }, []);

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

  // Mesma ação de Vacinação usada na sidebar e na barra inferior.
  const abrirVacinacao = async (e: MouseEvent<HTMLAnchorElement>) => {
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
  };

  // ==========================================
  // LINKS
  // ==========================================

  const estiloLink = ({
    isActive,
  }: {
    isActive: boolean;
  }) => `
    relative flex min-h-12 items-center rounded-xl
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
          ? 'bg-blue-50 text-[#126ca8] shadow-sm ring-1 ring-blue-200'
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
          : 'bg-[#020817] text-slate-100'
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
          background: #1478b8;
        }

        .easyvacc-light #menu-principal nav a[aria-current="page"]::before {
          background: #126ca8;
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

        .easyvacc-light aside .text-blue-400,
        .easyvacc-light aside .text-blue-500,
        .easyvacc-light aside .text-blue-600 {
          color: #126ca8 !important;
        }

        .easyvacc-light aside .bg-blue-500,
        .easyvacc-light aside .bg-blue-600 {
          background-color: #126ca8 !important;
        }

        .easyvacc-light aside .bg-blue-500.text-white,
        .easyvacc-light aside .bg-blue-600.text-white {
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

        .easyvacc-light main .text-blue-400,
        .easyvacc-light main .text-blue-500,
        .easyvacc-light main .text-blue-600 {
          color: #126ca8 !important;
        }

        .easyvacc-light main .bg-blue-500,
        .easyvacc-light main .bg-blue-600 {
          background-color: #126ca8 !important;
        }

        .easyvacc-light main .bg-blue-500.text-white,
        .easyvacc-light main .bg-blue-600.text-white {
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


        /* EasyVacc: compatibilidade com as novas cores das telas. */
        .easyvacc-light main [class~="bg-[#020817]"],
        .easyvacc-light main [class~="bg-[#020817]/40"],
        .easyvacc-light main [class~="bg-[#020817]/50"],
        .easyvacc-light main [class~="bg-[#020817]/60"],
        .easyvacc-light main [class~="bg-[#020817]/70"],
        .easyvacc-light main [class~="bg-[#020817]/80"],
        .easyvacc-light main [class~="bg-[#020817]/90"],
        .easyvacc-light main [class~="bg-[#090d16]"],
        .easyvacc-light main [class~="bg-[#0b1220]"] {
          background-color: #f8fafc !important;
        }
        .easyvacc-light main [class~="bg-[#081629]"],
        .easyvacc-light main [class~="bg-[#081629]/40"],
        .easyvacc-light main [class~="bg-[#081629]/50"],
        .easyvacc-light main [class~="bg-[#081629]/60"],
        .easyvacc-light main [class~="bg-[#081629]/70"],
        .easyvacc-light main [class~="bg-[#081629]/80"],
        .easyvacc-light main [class~="bg-[#081629]/90"],
        .easyvacc-light main [class~="bg-[#10253e]"],
        .easyvacc-light main [class~="bg-[#111827]"],
        .easyvacc-light main [class~="bg-[#0b2239]"] {
          background-color: #ffffff !important;
        }
        .easyvacc-light main [class~="bg-[#16243b]"],
        .easyvacc-light main [class~="bg-[#172b45]"] {
          background-color: #f1f5f9 !important;
        }
        .easyvacc-light main [class~="text-[#e2e8f0]"],
        .easyvacc-light main [class~="text-[#f8fafc]"] {
          color: #102b49 !important;
        }
        .easyvacc-light main [class~="text-[#94a3b8]"] {
          color: #475569 !important;
        }
        .easyvacc-light main [class~="border-[#304760]"],
        .easyvacc-light main [class~="border-[#18344d]"],
        .easyvacc-light main [class~="border-[#203b5a]"] {
          border-color: #cbd5e1 !important;
        }
        /* Cores da sidebar e destaque de navegação */
        .easyvacc-light #menu-principal nav a[aria-current="page"] {
          color: #126ca8 !important;
          background-color: #eff6ff !important;
        }
        .easyvacc-light #menu-principal nav a[aria-current="page"] svg {
          color: #126ca8 !important;
        }
        .easyvacc-light #menu-principal .text-blue-400,
        .easyvacc-light #menu-principal .text-blue-500,
        .easyvacc-light #menu-principal .text-blue-600 {
          color: #126ca8 !important;
        }
        .easyvacc-light #menu-principal .bg-blue-500,
        .easyvacc-light #menu-principal .bg-blue-600 {
          background-color: #126ca8 !important;
        }
        .easyvacc-light #menu-principal .bg-blue-500.text-white,
        .easyvacc-light #menu-principal .bg-blue-600.text-white {
          color: #fff !important;
        }
        /* Cartão de vacina: suporte a ambos os temas. */
        .easyvacc-app:not(.easyvacc-light) .easyvacc-vaccine-card {
          background-color: #081629;
          border-color: #304760;
          color: #f8fafc;
        }
        .easyvacc-app:not(.easyvacc-light) .easyvacc-vaccine-card .vaccine-title,
        .easyvacc-app:not(.easyvacc-light) .easyvacc-vaccine-card .vaccine-value {
          color: #f8fafc;
        }
        .easyvacc-app:not(.easyvacc-light) .easyvacc-vaccine-card .vaccine-muted {
          color: #94a3b8;
        }
        .easyvacc-app:not(.easyvacc-light) .easyvacc-vaccine-card .vaccine-divider {
          border-color: #304760;
        }


        /* Compatibilidade com estilos legados e fundos personalizados. */
        .easyvacc-light main [class~="bg-[#0b1628]"],
        .easyvacc-light main [class~="bg-[#0d1b30]"],
        .easyvacc-light main [class~="bg-[#101d32]"],
        .easyvacc-light main [class~="bg-[#121e32]"],
        .easyvacc-light main [class~="bg-[#152441]"],
        .easyvacc-light main [class~="bg-[#172554]"] {
          background-color: #ffffff !important;
        }
        .easyvacc-light main [class~="text-[#ffffff]"],
        .easyvacc-light main [class~="text-[#f1f5f9]"],
        .easyvacc-light main [class~="text-[#cbd5e1]"] {
          color: #102b49 !important;
        }
        .easyvacc-light main [class~="text-[#64748b]"] {
          color: #475569 !important;
        }
        .easyvacc-light main [class~="border-[#1e293b]"],
        .easyvacc-light main [class~="border-[#26364d]"] {
          border-color: #cbd5e1 !important;
        }


        /* Aparência do aplicativo mobile inspirada na prévia da landing.
           Apenas apresentação: mantém componentes, rotas e lógica existentes. */
        @media (max-width: 1023px) {
          .easyvacc-app main {
            overscroll-behavior-y: contain;
            -webkit-overflow-scrolling: touch;
          }
          .easyvacc-app main > * {
            max-width: 100%;
          }
          .easyvacc-app button,
          .easyvacc-app a {
            -webkit-tap-highlight-color: transparent;
          }
          .easyvacc-app main input,
          .easyvacc-app main select,
          .easyvacc-app main textarea {
            font-size: max(16px, 1em);
          }
          .easyvacc-app main :is(button, a):focus-visible {
            outline: 3px solid #60b9f4;
            outline-offset: 3px;
          }
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
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-[3px] lg:hidden"
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
              : 'border-[#203b5a] bg-[#081629] text-white'
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
              ? 'w-[min(88vw,340px)] lg:w-[260px]'
              : 'w-[min(88vw,340px)] lg:w-[72px]'
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
              <div className={`whitespace-nowrap text-[18px] font-extrabold tracking-tight ${temaClaro ? "text-[#102b49]" : "text-white"}`}>
                Easy{' '}
                <span className="text-[#1478b8]">
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
  onClick={abrirVacinacao}
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
                    <span className="flex min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {
                        notificacoesNaoLidas
                      }
                    </span>
                  )}
                </div>

                {!isOpen &&
                  notificacoesNaoLidas >
                    0 && (
                    <span className="absolute right-2 top-2 hidden h-1.5 w-1.5 rounded-full bg-blue-400 lg:block" />
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
                      flex min-h-12 w-full items-center rounded-xl
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
      ? 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-700'
      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-blue-500 hover:text-blue-400'
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
        {/* CABEÇALHO MOBILE — identidade visual e ações acessíveis */}
        <header className="relative z-20 flex h-[76px] shrink-0 items-center justify-between overflow-hidden border-b border-white/15 bg-[linear-gradient(125deg,#0c3b6a,#1478b8)] px-4 text-white shadow-[0_8px_24px_rgba(5,43,85,0.16)] lg:hidden print:hidden">
          <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-52 w-52 rounded-full bg-white/10" />
          <button type="button" onClick={() => void abrirTitular()} aria-label="Ir para o início" className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1478b8]">
            <img src="/logo.png" alt="" className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1" />
            <span className="text-left">
              <span className="block whitespace-nowrap text-lg font-extrabold leading-tight tracking-tight">Easy<span className="text-[#bce4ff]">Vacc</span></span>
              <span className={`block text-[9px] font-semibold uppercase tracking-[0.12em] text-[#dceeff]`}>Caderneta digital</span>
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={alternarTema} aria-label={temaClaro ? 'Ativar modo escuro' : 'Ativar modo claro'} title={temaClaro ? 'Ativar modo escuro' : 'Ativar modo claro'} className={`flex h-11 w-11 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1478b8] border-white/25 bg-white/15 text-white hover:bg-white/25`}>
              {temaClaro ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <NavLink to="/notificacoes" aria-label={notificacoesNaoLidas > 0 ? `Notificações: ${notificacoesNaoLidas} não lidas` : 'Notificações'} onClick={fecharMenuMobile} className={`relative flex h-11 w-11 items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1478b8] border-white/25 bg-white/15 text-white hover:bg-white/25`}>
              <Bell size={20} />
              {notificacoesNaoLidas > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-current bg-[#1478b8]" />}
            </NavLink>
          </div>
        </header>

        <main
          className={`relative min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden print:overflow-visible print:bg-white ${
            temaClaro ? 'bg-[#f6faff]' : 'bg-[#071426]'
          }`}
        >
  <Outlet />
</main>
        {/* Navegação fixa apenas no celular; não interfere na sidebar desktop. */}
        <nav aria-label="Navegação rápida" className={`relative z-30 grid h-[calc(70px+env(safe-area-inset-bottom))] shrink-0 grid-cols-5 items-start border-t px-1 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-8px_25px_rgba(0,0,0,0.05)] lg:hidden print:hidden ${temaClaro ? 'border-[#dce7f3] bg-white text-[#345371]' : 'border-[#253f5d] bg-[#0b1d33] text-[#c5d9ec]'}`}>
          <NavLink to="/dashboard" onClick={(e) => { e.preventDefault(); void abrirTitular(); }} className={({isActive}) => `flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1478b8] ${isActive ? (temaClaro ? 'bg-[#eaf4ff] text-[#126ca8]' : 'bg-[#153657] text-[#a9d9ff]') : (temaClaro ? 'hover:bg-[#f1f6fc]' : 'hover:bg-[#132b45]')}`}>
            <LayoutDashboard size={21} strokeWidth={1.9} /><span>Início</span>
          </NavLink>
          <NavLink to="/historico" onClick={abrirVacinacao} className={({isActive}) => `flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1478b8] ${isActive ? (temaClaro ? 'bg-[#eaf4ff] text-[#126ca8]' : 'bg-[#153657] text-[#a9d9ff]') : (temaClaro ? 'hover:bg-[#f1f6fc]' : 'hover:bg-[#132b45]')}`}>
            <Syringe size={21} strokeWidth={1.9} /><span>Vacinação</span>
          </NavLink>
          <NavLink to="/certificado" onClick={fecharMenuMobile} className={({isActive}) => `flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1478b8] ${isActive ? (temaClaro ? 'bg-[#eaf4ff] text-[#126ca8]' : 'bg-[#153657] text-[#a9d9ff]') : (temaClaro ? 'hover:bg-[#f1f6fc]' : 'hover:bg-[#132b45]')}`}>
            <FileText size={21} strokeWidth={1.9} /><span>Certificado</span>
          </NavLink>
          <NavLink to="/notificacoes" onClick={fecharMenuMobile} className={({isActive}) => `relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1478b8] ${isActive ? (temaClaro ? 'bg-[#eaf4ff] text-[#126ca8]' : 'bg-[#153657] text-[#a9d9ff]') : (temaClaro ? 'hover:bg-[#f1f6fc]' : 'hover:bg-[#132b45]')}`}>
            <Bell size={21} strokeWidth={1.9} />{notificacoesNaoLidas > 0 && <span className="absolute right-[25%] top-1 h-2 w-2 rounded-full bg-[#1478b8]" />}<span>Avisos</span>
          </NavLink>
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menu completo" aria-expanded={mobileOpen} aria-controls="menu-principal" className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1478b8] ${mobileOpen ? (temaClaro ? 'bg-[#eaf4ff] text-[#126ca8]' : 'bg-[#153657] text-[#a9d9ff]') : (temaClaro ? 'hover:bg-[#f1f6fc]' : 'hover:bg-[#132b45]')}`}>
            <Menu size={21} strokeWidth={1.9} /><span>Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}