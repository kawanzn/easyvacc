// ============================================================
// LANDING PAGE - EASYVACC
// ============================================================
// Versão enxuta e responsiva.
// Desktop: hero + preview da plataforma.
// Mobile: foco total na mensagem principal e acesso rápido.
// ============================================================

import { Link } from 'react-router-dom';

import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Syringe,
  UsersRound,
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ======================================================
          HEADER
          ====================================================== */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0b2239] sm:h-10 sm:w-10">
              <Syringe size={19} className="text-emerald-400" />
            </div>

            <div>
              <p className="text-base font-bold leading-none text-[#0b2239] sm:text-lg">
                Easy<span className="text-emerald-600">Vacc</span>
              </p>

              {/* Esconde o subtítulo em celulares muito pequenos */}
              <p className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400 sm:block">
                Caderneta Digital
              </p>
            </div>
          </Link>

          {/* Navegação desktop */}
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#recursos"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0b2239]"
            >
              Recursos
            </a>
          </nav>

          {/* Login */}
          <Link
            to="/login"
            className="
              group
              flex items-center gap-2
              rounded-lg
              bg-[#0b2239]
              px-4 py-2.5
              text-sm font-semibold text-white
              transition-all duration-200
              hover:bg-[#123453]
              sm:px-5 sm:py-3
            "
          >
            Entrar

            <ArrowRight
              size={15}
              className="hidden transition-transform group-hover:translate-x-1 sm:block"
            />
          </Link>
        </div>
      </header>


      <main>

        {/* ======================================================
            HERO
            ====================================================== */}
        <section className="overflow-hidden bg-slate-50">
          <div
            className="
              mx-auto
              grid
              max-w-7xl
              items-center
              gap-14
              px-5
              py-16
              sm:px-6 sm:py-20
              lg:min-h-[650px]
              lg:grid-cols-2
              lg:px-8
              lg:py-20
            "
          >

            {/* TEXTO */}
            <div className="max-w-xl">

              <div
                className="
                  mb-6
                  inline-flex items-center gap-2
                  rounded-full
                  border border-emerald-200
                  bg-emerald-50
                  px-3 py-1.5
                  text-xs font-semibold
                  text-emerald-700
                "
              >
                <ShieldCheck size={14} />

                Gestão digital de vacinação
              </div>

              <h1
                className="
                  text-[42px]
                  font-bold
                  leading-[1.05]
                  tracking-tight
                  text-[#0b2239]
                  sm:text-5xl
                  lg:text-[58px]
                "
              >
                Sua vacinação,
                <span className="block text-emerald-600">
                  organizada.
                </span>
              </h1>

              <p
                className="
                  mt-5
                  max-w-lg
                  text-base
                  leading-7
                  text-slate-600
                  sm:mt-6 sm:text-lg
                "
              >
                Histórico, dependentes e registros de vacinação
                reunidos em um só lugar.
              </p>

              <div className="mt-8">
                <Link
                  to="/login"
                  className="
                    group
                    inline-flex
                    items-center gap-3
                    rounded-lg
                    bg-emerald-600
                    px-5 py-3.5
                    text-sm font-semibold
                    text-white
                    shadow-sm
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:bg-emerald-700
                    hover:shadow-md
                  "
                >
                  Acessar minha caderneta

                  <ArrowRight
                    size={17}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>


            {/* ==================================================
                PREVIEW DA PLATAFORMA
                Aparece apenas em telas grandes.
                No celular não ocupa espaço desnecessário.
                ================================================== */}
            <div className="relative hidden lg:block">

              <div
                className="
                  overflow-hidden
                  rounded-xl
                  border border-slate-200
                  bg-white
                  shadow-[0_25px_60px_rgba(15,23,42,0.12)]
                  transition-transform
                  duration-500
                  hover:-translate-y-1
                "
              >
                {/* Barra da janela */}
                <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50 px-5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  </div>

                  <span className="text-[10px] font-medium text-slate-400">
                    EasyVacc
                  </span>
                </div>

                {/* Conteúdo */}
                <div className="p-7">

                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Visão geral
                      </p>

                      <h3 className="mt-2 text-lg font-bold text-slate-900">
                        Situação vacinal
                      </h3>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Syringe size={18} />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-7 rounded-lg border border-slate-200 p-5">
                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-xs text-slate-500">
                          Caderneta
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          Registros organizados
                        </p>
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={18} />
                      </div>

                    </div>

                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-4/5 rounded-full bg-emerald-600" />
                    </div>
                  </div>

                  {/* Mini cards */}
                  <div className="mt-4 grid grid-cols-3 gap-3">

                    <div className="rounded-lg border border-slate-200 p-4">
                      <FileText size={17} className="text-slate-500" />

                      <p className="mt-5 text-[10px] text-slate-400">
                        Histórico
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-800">
                        Registros
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                      <UsersRound size={17} className="text-slate-500" />

                      <p className="mt-5 text-[10px] text-slate-400">
                        Família
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-800">
                        Dependentes
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                      <Bell size={17} className="text-slate-500" />

                      <p className="mt-5 text-[10px] text-slate-400">
                        Avisos
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-800">
                        Informações
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ======================================================
            RECURSOS COMPACTOS

            Em vez de uma seção enorme com título + descrição +
            três cards cheios de texto, usamos três atalhos.
            ====================================================== */}
        <section
          id="recursos"
          className="border-y border-slate-200 bg-white"
        >
          <div
            className="
              mx-auto
              grid
              max-w-7xl
              divide-y divide-slate-200
              px-5
              sm:px-6
              md:grid-cols-3
              md:divide-x
              md:divide-y-0
              lg:px-8
            "
          >

            {/* Histórico */}
            <Link
              to="/login"
              className="
                group
                flex items-center
                gap-4
                py-6
                transition-all
                md:px-6 md:py-8
              "
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#0b2239]">
                <FileText size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#0b2239]">
                  Histórico
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Consulte seus registros
                </p>
              </div>

              <ArrowRight
                size={16}
                className="
                  shrink-0
                  text-slate-300
                  transition-all
                  group-hover:translate-x-1
                  group-hover:text-emerald-600
                "
              />
            </Link>


            {/* Dependentes */}
            <Link
              to="/login"
              className="
                group
                flex items-center
                gap-4
                py-6
                transition-all
                md:px-6 md:py-8
              "
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#0b2239]">
                <UsersRound size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#0b2239]">
                  Dependentes
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Organize sua família
                </p>
              </div>

              <ArrowRight
                size={16}
                className="
                  shrink-0
                  text-slate-300
                  transition-all
                  group-hover:translate-x-1
                  group-hover:text-emerald-600
                "
              />
            </Link>


            {/* Comprovantes */}
            <Link
              to="/login"
              className="
                group
                flex items-center
                gap-4
                py-6
                transition-all
                md:px-6 md:py-8
              "
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#0b2239]">
                <ShieldCheck size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#0b2239]">
                  Comprovantes
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Acesse seus documentos
                </p>
              </div>

              <ArrowRight
                size={16}
                className="
                  shrink-0
                  text-slate-300
                  transition-all
                  group-hover:translate-x-1
                  group-hover:text-emerald-600
                "
              />
            </Link>

          </div>
        </section>


        {/* ======================================================
            CTA FINAL
            Uma frase. Um botão. Acabou.
            ====================================================== */}
        <section className="bg-[#0b2239]">
          <div
            className="
              mx-auto
              flex
              max-w-7xl
              flex-col
              gap-6
              px-5
              py-12
              sm:px-6
              md:flex-row
              md:items-center
              md:justify-between
              lg:px-8
              lg:py-14
            "
          >
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Sua caderneta. Sempre com você.
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Consulte suas informações de vacinação.
              </p>
            </div>

            <Link
              to="/login"
              className="
                group
                inline-flex
                w-fit
                items-center gap-2
                rounded-lg
                bg-white
                px-5 py-3
                text-sm font-semibold
                text-[#0b2239]
                transition-all
                hover:-translate-y-0.5
              "
            >
              Entrar

              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>

      </main>


      {/* ======================================================
          FOOTER MINIMALISTA
          ====================================================== */}
      <footer className="border-t border-slate-800 bg-[#0b2239]">
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
            px-5
            py-5
            text-xs
            text-slate-500
            sm:px-6
            lg:px-8
          "
        >
          <div className="flex items-center gap-2">
            <Syringe size={13} className="text-emerald-500" />

            <span className="font-semibold text-white">
              EasyVacc
            </span>
          </div>

          <span>Caderneta digital</span>
        </div>
      </footer>

    </div>
  );
}