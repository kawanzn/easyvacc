import { useEffect, useRef, useState, type MouseEvent } from 'react';
import {
  NavLink,
  Outlet,
  Link,
  useNavigate,
  useLocation,
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
  const { pathname } = useLocation();

  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const fecharPainelMobileRef = useRef<HTMLButtonElement>(null);
  const abrirPainelMobileRef = useRef<HTMLButtonElement>(null);

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
  const [nomeUsuario, setNomeUsuario] = useState('');

  // A identidade exibida no menu pertence sempre ao usuário autenticado.
  // Não utilizar dados de pessoa ativa (que pode ser um dependente) nem cache local.
  useEffect(() => {
    let ativo = true;
    let versao = 0;
    let usuarioAtualId: string | null = null;

    const carregarIdentidade = async () => {
      const requisicao = ++versao;
      const { data: { user }, error: erroAuth } = await supabase.auth.getUser();
      if (!ativo || requisicao !== versao) return;

      if (erroAuth || !user) {
        usuarioAtualId = null;
        setNomeUsuario('');
        return;
      }

      if (usuarioAtualId !== user.id) {
        usuarioAtualId = user.id;
        setNomeUsuario('');
      }

      const { data: perfil, error: erroPerfil } = await supabase
        .from('users')
        .select('nome')
        .eq('id', user.id)
        .maybeSingle();

      // Ignora respostas de uma sessão anterior ao trocar de conta.
      if (!ativo || requisicao !== versao || usuarioAtualId !== user.id) return;
      if (erroPerfil) {
        console.error('Erro ao carregar nome do usuário no menu:', erroPerfil);
      }

      const nomePerfil = typeof perfil?.nome === 'string' ? perfil.nome.trim() : '';
      const nomeAuth = typeof user.user_metadata?.nome === 'string'
        ? user.user_metadata.nome.trim()
        : '';
      setNomeUsuario(nomePerfil || nomeAuth || 'Usuário');
    };

    void carregarIdentidade();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === 'SIGNED_OUT') {
        ++versao;
        usuarioAtualId = null;
        setNomeUsuario('');
        return;
      }

      if (evento === 'SIGNED_IN' || evento === 'USER_UPDATED' || evento === 'INITIAL_SESSION') {
        const idSessao = sessao?.user?.id ?? null;
        if (usuarioAtualId !== idSessao) {
          ++versao;
          usuarioAtualId = idSessao;
          setNomeUsuario('');
        }
        // Executa a consulta fora do callback do Auth para evitar disputa de lock.
        window.setTimeout(() => {
          if (ativo) void carregarIdentidade();
        }, 0);
      }
    });

    return () => {
      ativo = false;
      ++versao;
      subscription.unsubscribe();
    };
  }, []);

  const partesNomeUsuario = nomeUsuario.trim().split(/\s+/).filter(Boolean);
  const iniciaisUsuario = partesNomeUsuario.length > 1
    ? `${partesNomeUsuario[0][0]}${partesNomeUsuario[partesNomeUsuario.length - 1][0]}`.toLocaleUpperCase('pt-BR')
    : (partesNomeUsuario[0]?.slice(0, 2).toLocaleUpperCase('pt-BR') || '—');

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

  // O painel mobile abre com foco no controle de fechar.
  useEffect(() => {
    if (mobileOpen && window.matchMedia('(max-width: 1023px)').matches) {
      fecharPainelMobileRef.current?.focus();
    }
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

  // Somente o cabeçalho do aplicativo móvel: as páginas desktop permanecem intactas.
  const titulosMobile: Record<string, { etiqueta: string; titulo: string; descricao: string }> = {
    '/dashboard': {
      etiqueta: nomeUsuario ? `Olá, ${nomeUsuario.split(' ')[0]}!` : 'Olá, bem-vindo(a)!',
      titulo: 'Minha caderneta',
      descricao: 'Tudo sobre sua vacinação em um só lugar.',
    },
    '/historico': {
      etiqueta: 'Seus registros digitais',
      titulo: 'Vacinação',
      descricao: 'Seu histórico de vacinas, organizado.',
    },
    '/certificado': {
      etiqueta: 'Comprovantes digitais',
      titulo: 'Certificados',
      descricao: 'Seus documentos de vacinação.',
    },
    '/dependentes': {
      etiqueta: 'Você e sua família',
      titulo: 'Meus dependentes',
      descricao: 'Acompanhe quem está vinculado à sua conta.',
    },
    '/adicionar-dependente': {
      etiqueta: 'Você e sua família',
      titulo: 'Meus dependentes',
      descricao: 'Gerencie os familiares vinculados à sua conta.',
    },
    '/perfil': {
      etiqueta: 'Sua conta EasyVacc',
      titulo: 'Meu perfil',
      descricao: 'Seus dados, saúde e segurança.',
    },
    '/notificacoes': {
      etiqueta: 'Fique por dentro',
      titulo: 'Notificações',
      descricao: 'Avisos e atualizações em um só lugar.',
    },
    '/postos': {
      etiqueta: 'Rede de atendimento',
      titulo: 'Postos de saúde',
      descricao: 'Encontre unidades de saúde na sua região.',
    },
    '/campanhas': {
      etiqueta: 'Informações de vacinação',
      titulo: 'Campanhas',
      descricao: 'Acompanhe as campanhas divulgadas.',
    },
  };
  const cabecalhoMobile = titulosMobile[pathname] ?? titulosMobile['/dashboard'];

  // Cada rota começa pelo topo do conteúdo no celular; desktop não é alterado.
  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      const areaRolagem = document.querySelector<HTMLElement>('.easyvacc-app .ev-mobile-scroll');
      if (areaRolagem) areaRolagem.scrollTop = 0;
    }
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div
      className={`easyvacc-app flex h-[100dvh] overflow-hidden font-sans ${
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

        /* Fundo contínuo: camada independente da rolagem do conteúdo. */
        .easyvacc-app .ev-wave-surface {
          background: #071a30;
          --ev-wave-top: #143c63;
          --ev-wave-bottom: #1b4d78;
          --ev-wave-line: #3979a7;
        }
        .easyvacc-app.easyvacc-light .ev-wave-surface {
          background: #dbeaf7;
          --ev-wave-top: #b2d0e9;
          --ev-wave-bottom: #a5c9e6;
          --ev-wave-line: #679ac2;
        }
        .easyvacc-app main.ev-wave-content,
        .easyvacc-app.easyvacc-light main.ev-wave-content {
          background: transparent !important;
        }
        @media print {
          .easyvacc-app main.ev-wave-content {
            background: white !important;
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
      {/* FUNDO ESCURECIDO DO PAINEL MOBILE */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={fecharMenuMobile}
          className="ev-mobile-sheet-backdrop fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[3px] lg:hidden print:hidden"
        />
      )}

      {/* ======================================
          SIDEBAR EXCLUSIVA DO DESKTOP
      ====================================== */}

      <aside
        id="menu-principal"
        aria-label="Menu principal"
        className={`
          ev-sidebar ev-sidebar-desktop-only hidden fixed inset-y-0 left-0 z-50 flex-col lg:flex
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
                Easy<span className="text-[#1478b8]">
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
                        `/dependentes?selecionado=${dependente.id}`);
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold shadow-sm text-[#0b2239]" aria-hidden="true">
              {iniciaisUsuario}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-200">
                {nomeUsuario || 'Carregando...'}
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

      {/* Painel de opções exclusivo do celular. A sidebar acima permanece desktop. */}
      {mobileOpen && (
        <section
          id="menu-mobile"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-mobile-titulo"
          className={`ev-mobile-sheet fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-[560px] lg:hidden print:hidden ${temaClaro ? 'ev-mobile-sheet-light' : 'ev-mobile-sheet-dark'}`}
          onKeyDown={(event) => {
            if (event.key !== 'Tab') return;
            const botoes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
            if (!botoes.length) return;
            const primeiro = botoes[0];
            const ultimo = botoes[botoes.length - 1];
            if (event.shiftKey && document.activeElement === primeiro) {
              event.preventDefault();
              ultimo.focus();
            } else if (!event.shiftKey && document.activeElement === ultimo) {
              event.preventDefault();
              primeiro.focus();
            }
          }}
        >
          <div className="ev-mobile-sheet-handle" aria-hidden="true" />
          <div className="ev-mobile-sheet-header">
            <div className="ev-mobile-sheet-account">
              <div className="ev-mobile-sheet-avatar" aria-hidden="true">{iniciaisUsuario}</div>
              <div className="min-w-0">
                <p className="ev-mobile-sheet-eyebrow">Sua conta</p>
                <h2 id="menu-mobile-titulo" className="ev-mobile-sheet-name truncate">{nomeUsuario || 'EasyVacc'}</h2>
              </div>
            </div>
            <button
              ref={fecharPainelMobileRef}
              type="button"
              onClick={() => { fecharMenuMobile(); abrirPainelMobileRef.current?.focus(); }}
              aria-label="Fechar menu"
              className="ev-mobile-sheet-close"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          <div className="ev-mobile-sheet-body">
            <p className="ev-mobile-sheet-section-label">Mais opções</p>
            <div className="ev-mobile-sheet-grid">
              <NavLink to="/perfil" onClick={fecharMenuMobile} className="ev-mobile-sheet-tile">
                <span className="ev-mobile-sheet-tile-icon"><UserRound size={21} strokeWidth={1.8} /></span>
                <span>Meu perfil</span>
                <ChevronRight size={15} className="ev-mobile-sheet-chevron" />
              </NavLink>
              <NavLink to="/postos" onClick={fecharMenuMobile} className="ev-mobile-sheet-tile">
                <span className="ev-mobile-sheet-tile-icon"><MapPin size={21} strokeWidth={1.8} /></span>
                <span>Postos de saúde</span>
                <ChevronRight size={15} className="ev-mobile-sheet-chevron" />
              </NavLink>
              <NavLink to="/campanhas" onClick={fecharMenuMobile} className="ev-mobile-sheet-tile">
                <span className="ev-mobile-sheet-tile-icon"><CalendarDays size={21} strokeWidth={1.8} /></span>
                <span>Campanhas</span>
                <ChevronRight size={15} className="ev-mobile-sheet-chevron" />
              </NavLink>
              <NavLink to="/adicionar-dependente" onClick={fecharMenuMobile} className="ev-mobile-sheet-tile">
                <span className="ev-mobile-sheet-tile-icon"><UserPlus size={21} strokeWidth={1.8} /></span>
                <span>Adicionar dependente</span>
                <ChevronRight size={15} className="ev-mobile-sheet-chevron" />
              </NavLink>
            </div>

            {dependentes.length > 0 && (
              <div className="ev-mobile-sheet-dependents">
                <div className="ev-mobile-sheet-section-heading">
                  <p className="ev-mobile-sheet-section-label">Pessoas vinculadas</p>
                  <span>{dependentes.length}</span>
                </div>
                <div className="ev-mobile-sheet-chips">
                  {dependentes.map((dependente) => (
                    <button
                      type="button"
                      key={dependente.id}
                      className="ev-mobile-sheet-chip"
                      onClick={() => {
                        salvarPessoaAtiva({
                          tipo: 'dependente',
                          id: dependente.id,
                          nome: dependente.nome,
                          parentesco: dependente.parentesco,
                        });
                        window.dispatchEvent(new Event('pessoaAtivaAtualizada'));
                        fecharMenuMobile();
                        navigate(`/dependentes?selecionado=${dependente.id}`);
                      }}
                    >
                      <span className="ev-mobile-sheet-chip-avatar" aria-hidden="true">{dependente.nome?.charAt(0).toUpperCase()}</span>
                      <span className="truncate">{dependente.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="ev-mobile-sheet-footer">
              <span>Conta e segurança</span>
              <button type="button" onClick={handleLogout} className="ev-mobile-sheet-logout">
                <LogOut size={18} strokeWidth={1.9} />
                Sair da conta
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ======================================
          CONTEÚDO
      ====================================== */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Cabeçalho mobile inspirado no aplicativo mostrado na Landing.
            Desktop: continua usando a sidebar e o cabeçalho de cada página. */}
        <header className="ev-mobile-hero lg:hidden print:hidden" aria-label="Cabeçalho do EasyVacc">
          <div className="ev-mobile-hero-row">
            <Link
              to="/dashboard"
              onClick={(event) => { event.preventDefault(); void abrirTitular(); }}
              className="ev-mobile-brand"
              aria-label="EasyVacc — voltar ao início"
            >
              <span className="ev-mobile-brand-icon"><img src="/logo.png" alt="" /></span>
              <span>Easy<span className="ev-mobile-brand-accent">Vacc</span></span>
            </Link>
            <div className="ev-mobile-hero-actions">
              <button
                type="button"
                onClick={alternarTema}
                aria-label={temaClaro ? 'Ativar modo escuro' : 'Ativar modo claro'}
                title={temaClaro ? 'Ativar modo escuro' : 'Ativar modo claro'}
                className="ev-mobile-hero-action"
              >
                {temaClaro ? <Moon size={19} /> : <Sun size={19} />}
              </button>
              <NavLink
                to="/notificacoes"
                aria-label={notificacoesNaoLidas > 0 ? `Notificações: ${notificacoesNaoLidas} não lidas` : 'Notificações'}
                onClick={fecharMenuMobile}
                className="ev-mobile-hero-action"
              >
                <Bell size={19} />
                {notificacoesNaoLidas > 0 && <span className="ev-mobile-notification-dot" />}
              </NavLink>
            </div>
          </div>
          <div className="ev-mobile-hero-copy">
            <p className="ev-mobile-eyebrow">{cabecalhoMobile.etiqueta}</p>
            <h1>{cabecalhoMobile.titulo}</h1>
            <p className="ev-mobile-hero-description">{cabecalhoMobile.descricao}</p>
          </div>
        </header>

        {/* Fundo em uma camada fixa na área visível: não rola com o Perfil. */}
        <div className="ev-mobile-region relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div
            aria-hidden="true"
            className="ev-wave-surface pointer-events-none absolute inset-0 overflow-hidden print:hidden"
          >
            <svg
              className="block h-full w-full"
              viewBox="0 0 1440 900"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Faixa superior ondulada */}
              <path
                d="M0 0 H1440 V215 C1320 165 1250 5 1080 42 C850 90 780 255 550 235 C320 214 190 92 0 205 Z"
                fill="var(--ev-wave-top)"
              />

              {/* Faixa inferior: chega até a borda inferior da tela */}
              <path
                d="M0 790 C185 645 315 640 495 710 C670 782 805 790 960 695 C1110 604 1240 485 1340 615 C1385 675 1415 695 1440 705 V900 H0 Z"
                fill="var(--ev-wave-bottom)"
              />

              {/* Linhas geométricas finas, sem animação */}
              <g
                fill="none"
                stroke="var(--ev-wave-line)"
                strokeWidth="2.5"
                opacity="0.55"
              >
                <path d="M0 757 C185 612 320 611 500 683 C677 754 807 758 953 665 C1100 574 1237 462 1347 587 C1390 647 1418 665 1440 677" />
                <path d="M0 773 C185 628 320 627 500 699 C677 770 807 774 953 681 C1100 590 1237 478 1347 603 C1390 663 1418 681 1440 693" />
                <path d="M0 789 C185 644 320 643 500 715 C677 786 807 790 953 697 C1100 606 1237 494 1347 619 C1390 679 1418 697 1440 709" />
                <path d="M990 -80 L1490 480" />
                <path d="M1080 -80 L1580 480" />
                <path d="M1170 -80 L1670 480" />
              </g>
            </svg>
          </div>

          {/* Apenas o conteúdo rola; a arte permanece até a borda inferior. */}
          <main className="ev-wave-content ev-mobile-scroll relative z-10 h-full min-w-0 overflow-y-auto overflow-x-hidden print:overflow-visible">
            <Outlet />
          </main>
        </div>
        {/* Navegação inferior flutuante no celular; a sidebar fica escondida até abrir o menu. */}
        <nav
          aria-label="Navegação principal no celular"
          className={`ev-bottom-nav relative z-30 mx-3 mb-[calc(8px+env(safe-area-inset-bottom))] grid h-[70px] shrink-0 grid-cols-5 items-center rounded-[22px] border px-1.5 py-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.18)] lg:hidden print:hidden ${temaClaro ? 'border-[#dce7f3] bg-white/95 text-[#345371]' : 'border-[#294a6b] bg-[#0b1d33]/95 text-[#c5d9ec]'}`}
        >
          <NavLink to="/dashboard" onClick={(e) => { e.preventDefault(); void abrirTitular(); }} className={({isActive}) => `flex min-h-[55px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive ? (temaClaro ? 'bg-[#eaf4ff] text-[#126ca8]' : 'bg-[#153657] text-[#a9d9ff]') : (temaClaro ? 'hover:bg-[#f1f6fc]' : 'hover:bg-[#132b45]')}`}>
            <LayoutDashboard size={21} strokeWidth={1.9} /><span>Início</span>
          </NavLink>
          <NavLink to="/historico" onClick={abrirVacinacao} className={({isActive}) => `flex min-h-[55px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive ? (temaClaro ? 'bg-[#eaf4ff] text-[#126ca8]' : 'bg-[#153657] text-[#a9d9ff]') : (temaClaro ? 'hover:bg-[#f1f6fc]' : 'hover:bg-[#132b45]')}`}>
            <Syringe size={21} strokeWidth={1.9} /><span>Vacinação</span>
          </NavLink>
          <NavLink to="/certificado" onClick={fecharMenuMobile} className={({isActive}) => `flex min-h-[55px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive ? (temaClaro ? 'bg-[#eaf4ff] text-[#126ca8]' : 'bg-[#153657] text-[#a9d9ff]') : (temaClaro ? 'hover:bg-[#f1f6fc]' : 'hover:bg-[#132b45]')}`}>
            <FileText size={21} strokeWidth={1.9} /><span>Certificado</span>
          </NavLink>
          <NavLink to="/dependentes" onClick={fecharMenuMobile} className={({isActive}) => `flex min-h-[55px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive ? (temaClaro ? 'bg-[#eaf4ff] text-[#126ca8]' : 'bg-[#153657] text-[#a9d9ff]') : (temaClaro ? 'hover:bg-[#f1f6fc]' : 'hover:bg-[#132b45]')}`}>
            <UserPlus size={21} strokeWidth={1.9} /><span>Dependentes</span>
          </NavLink>
          <button ref={abrirPainelMobileRef} type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menu completo" aria-expanded={mobileOpen} aria-controls="menu-mobile" className={`flex min-h-[55px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${mobileOpen ? (temaClaro ? 'bg-[#eaf4ff] text-[#126ca8]' : 'bg-[#153657] text-[#a9d9ff]') : (temaClaro ? 'hover:bg-[#f1f6fc]' : 'hover:bg-[#132b45]')}`}>
            <Menu size={21} strokeWidth={1.9} /><span>Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}