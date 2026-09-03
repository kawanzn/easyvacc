import { useEffect, useState } from 'react';

import {
  NavLink,
  Outlet,
  Link,
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


/*
  ============================================================
  LAYOUT PRINCIPAL - EASYVACC
  ============================================================

  Este componente controla:

  - Sidebar
  - Navegação
  - Dependentes
  - Notificações
  - Área principal das páginas

  NOVA IDENTIDADE:

  - Azul-marinho institucional
  - Fundo principal claro
  - Verde somente para destaque
  - Menos efeitos decorativos
  - Navegação com página ativa
  - Aparência de sistema profissional
*/


export default function Layout() {

  // ==========================================================
  // SIDEBAR
  // ==========================================================

  const [isOpen, setIsOpen] = useState(true);


  // ==========================================================
  // DADOS
  // ==========================================================

  const [dependentes, setDependentes] = useState<any[]>([]);

  const [notificacoesNaoLidas, setNotificacoesNaoLidas] =
    useState(0);


  // ==========================================================
  // API
  // ==========================================================

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000';


  // ==========================================================
  // CARREGAMENTO DOS DADOS
  // ==========================================================

  useEffect(() => {

    const usuarioId = localStorage.getItem('usuarioId');

    if (!usuarioId) {
      return;
    }


    // --------------------------------------------------------
    // DEPENDENTES
    // --------------------------------------------------------

    fetch(`${API_URL}/api/dependentes/${usuarioId}`)

      .then((res) => res.json())

      .then((data) => {

        if (data.sucesso) {
          setDependentes(data.dados);
        }

      })

      .catch((erro) => {
        console.error(
          'Erro ao buscar dependentes:',
          erro
        );
      });


    // --------------------------------------------------------
    // NOTIFICAÇÕES
    // --------------------------------------------------------

    fetch(`${API_URL}/api/notificacoes/${usuarioId}`)

      .then((res) => res.json())

      .then((data) => {

        if (data.sucesso) {

          const quantidadeNaoLidas =
            data.dados.filter(
              (notificacao: any) =>
                notificacao.lida === false
            ).length;

          setNotificacoesNaoLidas(
            quantidadeNaoLidas
          );

        }

      })

      .catch((erro) => {
        console.error(
          'Erro ao buscar notificações:',
          erro
        );
      });

  }, [API_URL]);


  // ==========================================================
  // ESTILO DOS LINKS
  // ==========================================================

  /*
    NavLink informa automaticamente se a rota está ativa.

    Assim conseguimos destacar a página atual no menu.
  */

  const estiloLink = ({
    isActive,
  }: {
    isActive: boolean;
  }) => `

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
        ? `
          bg-white/10
          text-white
        `
        : `
          text-slate-400
          hover:bg-white/[0.06]
          hover:text-slate-100
        `
    }

  `;


  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (

    <div
      className="
        flex
        h-screen
        overflow-hidden

        bg-slate-50

        font-sans
        text-slate-900
      "
    >


      {/* ======================================================
          SIDEBAR
         ====================================================== */}

      <aside
        className={`
          relative
          z-30

          flex
          shrink-0
          flex-col

          border-r
          border-[#18344d]

          bg-[#0b2239]

          text-white

          transition-[width]
          duration-200
          ease-out

          print:hidden

          ${isOpen ? 'w-[260px]' : 'w-[72px]'}
        `}
      >


        {/* ====================================================
            LOGO
           ==================================================== */}

        <div
          className={`
            flex
            h-[76px]
            shrink-0
            items-center

            border-b
            border-white/[0.08]

            ${
              isOpen
                ? 'justify-between px-5'
                : 'justify-center'
            }
          `}
        >


          {/* LOGO ABERTA */}

          {isOpen && (

            <Link
              to="/dashboard"
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center

                  rounded-md

                  bg-white
                "
              >

                <img
                  src="/logo.png"
                  alt="EasyVacc"
                  className="
                    h-7
                    w-7
                    object-contain
                  "
                />

              </div>


              <div>

                <div
                  className="
                    text-[17px]
                    font-bold
                    tracking-tight
                    text-white
                  "
                >
                  Easy
                  <span className="text-emerald-400">
                    Vacc
                  </span>
                </div>


                <p
                  className="
                    mt-0.5

                    text-[9px]
                    font-medium
                    uppercase
                    tracking-[0.16em]

                    text-slate-500
                  "
                >
                  Caderneta digital
                </p>

              </div>

            </Link>

          )}


          {/* LOGO RECOLHIDA */}

          {!isOpen && (

            <Link
              to="/dashboard"
              title="EasyVacc"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-md

                bg-white
              "
            >

              <img
                src="/logo.png"
                alt="EasyVacc"
                className="
                  h-7
                  w-7
                  object-contain
                "
              />

            </Link>

          )}

        </div>


        {/* ====================================================
            MENU
           ==================================================== */}

        <nav
          className="
            flex-1
            overflow-y-auto
            overflow-x-hidden

            px-3
            py-5
          "
        >


          {/* ==================================================
              VISÃO GERAL
             ================================================== */}

          {isOpen && (

            <p
              className="
                mb-2
                px-3

                text-[9px]
                font-semibold
                uppercase
                tracking-[0.16em]

                text-slate-500
              "
            >
              Visão geral
            </p>

          )}


          <div className="space-y-1">

            <NavLink
              to="/dashboard"
              title="Início"
              className={estiloLink}
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


          {/* ==================================================
              CADERNETA
             ================================================== */}

          <div className="mt-6">

            {isOpen && (

              <p
                className="
                  mb-2
                  px-3

                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]

                  text-slate-500
                "
              >
                Caderneta
              </p>

            )}


            <div className="space-y-1">


              {/* VACINAS */}

              <NavLink
                to="/historico"
                title="Vacinação"
                className={estiloLink}
              >

                <Syringe
                  size={18}
                  strokeWidth={1.8}
                  className="shrink-0"
                />

                {isOpen && (
                  <span className="truncate">
                    Vacinação
                  </span>
                )}

              </NavLink>


              {/* CERTIFICADO */}

              <NavLink
                to="/certificado"
                title="Certificado"
                className={estiloLink}
              >

                <FileText
                  size={18}
                  strokeWidth={1.8}
                  className="shrink-0"
                />

                {isOpen && (
                  <span className="truncate">
                    Certificado
                  </span>
                )}

              </NavLink>

            </div>

          </div>


          {/* ==================================================
              SERVIÇOS
             ================================================== */}

          <div className="mt-6">

            {isOpen && (

              <p
                className="
                  mb-2
                  px-3

                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]

                  text-slate-500
                "
              >
                Serviços
              </p>

            )}


            <div className="space-y-1">


              {/* NOTIFICAÇÕES */}

              <NavLink
                to="/notificacoes"
                title="Notificações"
                className={estiloLink}
              >

                <Bell
                  size={18}
                  strokeWidth={1.8}
                  className="shrink-0"
                />


                {isOpen && (

                  <div
                    className="
                      flex
                      min-w-0
                      flex-1
                      items-center
                      justify-between
                      gap-3
                    "
                  >

                    <span className="truncate">
                      Notificações
                    </span>


                    {notificacoesNaoLidas > 0 && (

                      <span
                        className="
                          flex
                          min-w-5
                          items-center
                          justify-center

                          rounded-full

                          bg-emerald-500

                          px-1.5
                          py-0.5

                          text-[9px]
                          font-bold
                          text-white
                        "
                      >
                        {notificacoesNaoLidas}
                      </span>

                    )}

                  </div>

                )}


                {!isOpen &&
                  notificacoesNaoLidas > 0 && (

                    <span
                      className="
                        absolute
                        right-2
                        top-2

                        h-1.5
                        w-1.5

                        rounded-full
                        bg-emerald-400
                      "
                    />

                  )}

              </NavLink>


              {/* CAMPANHAS */}

              <NavLink
                to="/campanhas"
                title="Campanhas"
                className={estiloLink}
              >

                <CalendarDays
                  size={18}
                  strokeWidth={1.8}
                  className="shrink-0"
                />

                {isOpen && (
                  <span className="truncate">
                    Campanhas
                  </span>
                )}

              </NavLink>


              {/* POSTOS */}

              <NavLink
                to="/postos"
                title="Postos de Saúde"
                className={estiloLink}
              >

                <MapPin
                  size={18}
                  strokeWidth={1.8}
                  className="shrink-0"
                />

                {isOpen && (
                  <span className="truncate">
                    Postos de saúde
                  </span>
                )}

              </NavLink>


              {/* PERFIL */}

              <NavLink
                to="/perfil"
                title="Meu Perfil"
                className={estiloLink}
              >

                <UserRound
                  size={18}
                  strokeWidth={1.8}
                  className="shrink-0"
                />

                {isOpen && (
                  <span className="truncate">
                    Meu perfil
                  </span>
                )}

              </NavLink>

            </div>

          </div>


          {/* ==================================================
              DEPENDENTES
             ================================================== */}

          <div className="mt-6">


            {isOpen && (

              <div
                className="
                  mb-2
                  flex
                  items-center
                  justify-between

                  px-3
                "
              >

                <p
                  className="
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.16em]

                    text-slate-500
                  "
                >
                  Dependentes
                </p>


                {dependentes.length > 0 && (

                  <span
                    className="
                      text-[9px]
                      font-semibold
                      text-slate-500
                    "
                  >
                    {dependentes.length}
                  </span>

                )}

              </div>

            )}


            {/* ==================================================
                LISTA DE DEPENDENTES
               ================================================== */}

            <div className="space-y-1">

              {dependentes.map((dependente) => (

                <div
                  key={dependente.id}
                  title={dependente.nome}
                  className={`
                    flex
                    h-11
                    items-center

                    rounded-md

                    text-slate-400

                    ${
                      isOpen
                        ? 'gap-3 px-3'
                        : 'justify-center'
                    }
                  `}
                >


                  {/* INICIAL */}

                  <div
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center

                      rounded-md

                      bg-white/[0.08]

                      text-[11px]
                      font-semibold
                      text-slate-200
                    "
                  >
                    {dependente.nome
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>


                  {/* INFORMAÇÕES */}

                  {isOpen && (

                    <div className="min-w-0">

                      <p
                        className="
                          truncate
                          text-xs
                          font-medium
                          text-slate-300
                        "
                      >
                        {dependente.nome}
                      </p>

                      <p
                        className="
                          mt-0.5
                          truncate
                          text-[9px]
                          text-slate-500
                        "
                      >
                        {dependente.parentesco}
                      </p>

                    </div>

                  )}

                </div>

              ))}


              {/* SEM DEPENDENTES */}

              {dependentes.length === 0 &&
                isOpen && (

                  <div
                    className="
                      px-3
                      py-2
                    "
                  >

                    <p
                      className="
                        text-[11px]
                        leading-5
                        text-slate-500
                      "
                    >
                      Nenhum dependente cadastrado.
                    </p>

                  </div>

                )}


              {/* ADICIONAR */}

              <NavLink
                to="/adicionar-dependente"
                title="Adicionar dependente"
                className={estiloLink}
              >

                <UserPlus
                  size={18}
                  strokeWidth={1.8}
                  className="shrink-0"
                />

                {isOpen && (
                  <span className="truncate">
                    Adicionar dependente
                  </span>
                )}

              </NavLink>

            </div>

          </div>

        </nav>


        {/* ====================================================
            RODAPÉ DA SIDEBAR
           ==================================================== */}

        <div
          className="
            shrink-0

            border-t
            border-white/[0.08]

            p-3
          "
        >


          {/* CONTA */}

          {isOpen && (

            <Link
              to="/perfil"
              className="
                mb-2

                flex
                items-center
                gap-3

                rounded-md

                px-3
                py-2.5

                transition-colors

                hover:bg-white/[0.05]
              "
            >

              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center

                  rounded-md

                  bg-white

                  text-xs
                  font-bold
                  text-[#0b2239]
                "
              >
                JV
              </div>


              <div className="min-w-0 flex-1">

                <p
                  className="
                    truncate
                    text-xs
                    font-medium
                    text-slate-200
                  "
                >
                  João Victor
                </p>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-[9px]
                    text-slate-500
                  "
                >
                  Conta pessoal
                </p>

              </div>


              <ChevronRight
                size={14}
                className="text-slate-600"
              />

            </Link>

          )}


          {/* SAIR */}

          <Link
            to="/"
            title="Sair da conta"
            className={`
              flex
              h-10
              items-center

              rounded-md

              text-slate-500

              transition-colors

              hover:bg-red-500/10
              hover:text-red-300

              ${
                isOpen
                  ? 'gap-3 px-3'
                  : 'justify-center'
              }
            `}
          >

            <LogOut
              size={17}
              strokeWidth={1.8}
              className="shrink-0"
            />

            {isOpen && (

              <span
                className="
                  text-xs
                  font-medium
                "
              >
                Sair da conta
              </span>

            )}

          </Link>

        </div>


        {/* ====================================================
            BOTÃO DE RECOLHER
           ==================================================== */}

        <button
          onClick={() => setIsOpen(!isOpen)}
          title={
            isOpen
              ? 'Recolher menu'
              : 'Expandir menu'
          }
          className="
            absolute
            -right-3.5
            top-[30px]

            z-40

            flex
            h-7
            w-7
            items-center
            justify-center

            rounded-full

            border
            border-slate-200

            bg-white

            text-slate-500

            shadow-sm

            transition-colors

            hover:bg-slate-50
            hover:text-slate-900
          "
        >

          {isOpen ? (
            <PanelLeftClose size={14} />
          ) : (
            <PanelLeftOpen size={14} />
          )}

        </button>

      </aside>


      {/* ======================================================
          CONTEÚDO PRINCIPAL
         ====================================================== */}

      <main
        className="
          relative
          flex-1

          overflow-y-auto

          bg-slate-50

          print:overflow-visible
          print:bg-white
        "
      >

        {/* Dashboard, Histórico, Perfil, etc. */}

        <Outlet />

      </main>

    </div>

  );

}