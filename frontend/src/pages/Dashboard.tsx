import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  MapPin,
  Plus,
  ShieldCheck,
  Syringe,
  User,
} from 'lucide-react';

import { Link } from 'react-router-dom';


export default function Dashboard() {

  return (

    /*
      ==========================================================
      DASHBOARD EASYVACC
      ==========================================================

      Nova identidade visual:
      - Institucional
      - Profissional
      - Clean
      - Inspirada em sistemas de saúde / healthtech
      - Verde utilizado apenas como destaque
      - Azul-marinho como cor institucional
      - Sem efeitos exagerados

      As rotas originais foram mantidas.
    */

    <div className="min-h-full bg-slate-50 text-slate-900">


      {/* ======================================================
          CONTAINER PRINCIPAL
         ====================================================== */}

      <div
        className="
          mx-auto
          max-w-7xl
          px-6
          py-8
          md:px-10
          md:py-10
        "
      >


        {/* ====================================================
            CABEÇALHO
           ==================================================== */}

        <header
          className="
            mb-8
            flex
            flex-col
            justify-between
            gap-5
            border-b
            border-slate-200
            pb-7

            lg:flex-row
            lg:items-end
          "
        >

          <div>

            {/* CAMINHO DA PÁGINA */}

            <div
              className="
                mb-2
                flex
                items-center
                gap-2
                text-xs
                font-semibold
                uppercase
                tracking-[0.12em]
                text-slate-500
              "
            >

              <span>EasyVacc</span>

              <ChevronRight size={13} />

              <span className="text-slate-700">
                Visão geral
              </span>

            </div>


            {/* TÍTULO */}

            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                text-slate-950

                md:text-[34px]
              "
            >
              Visão geral
            </h1>


            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-slate-500
              "
            >
              Acompanhe sua situação vacinal e acesse os
              principais serviços da sua caderneta digital.
            </p>

          </div>


          {/* AÇÕES DO CABEÇALHO */}

          <div className="flex items-center gap-3">

            <Link
              to="/notificacoes"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center

                rounded-lg

                border
                border-slate-200

                bg-white

                text-slate-500

                shadow-sm

                transition-colors

                hover:border-slate-300
                hover:bg-slate-50
                hover:text-slate-800
              "
              title="Notificações"
            >
              <Bell size={18} />
            </Link>


            <Link
              to="/perfil"
              className="
                flex
                items-center
                gap-3

                rounded-lg

                border
                border-slate-200

                bg-white

                px-3
                py-2

                shadow-sm

                transition-colors

                hover:border-slate-300
                hover:bg-slate-50
              "
            >

              <div
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center

                  rounded-md

                  bg-slate-900
                  text-white
                "
              >
                <User size={16} />
              </div>


              <div className="hidden text-left sm:block">

                <p
                  className="
                    text-xs
                    font-semibold
                    text-slate-800
                  "
                >
                  João Victor
                </p>

                <p
                  className="
                    text-[10px]
                    text-slate-400
                  "
                >
                  Minha conta
                </p>

              </div>

            </Link>

          </div>

        </header>


        {/* ====================================================
            PAINEL PRINCIPAL
           ==================================================== */}

        <section
          className="
            mb-7
            overflow-hidden

            rounded-xl

            border
            border-slate-200

            bg-white

            shadow-sm
          "
        >

          <div
            className="
              grid
              lg:grid-cols-[1fr_340px]
            "
          >


            {/* ==================================================
                APRESENTAÇÃO
               ================================================== */}

            <div
              className="
                p-6
                md:p-8
              "
            >

              <div
                className="
                  mb-5
                  inline-flex
                  items-center
                  gap-2

                  rounded-md

                  bg-emerald-50

                  px-2.5
                  py-1.5

                  text-xs
                  font-semibold
                  text-emerald-800
                "
              >

                <CheckCircle2 size={14} />

                Caderneta atualizada

              </div>


              <p
                className="
                  text-sm
                  font-medium
                  text-slate-500
                "
              >
                Bem-vindo,
              </p>


              <h2
                className="
                  mt-1
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-950

                  md:text-3xl
                "
              >
                João Victor
              </h2>


              <p
                className="
                  mt-3
                  max-w-xl

                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Consulte seus registros de imunização,
                acompanhe próximas doses e mantenha seus
                documentos de vacinação organizados em um
                único ambiente.
              </p>


              {/* BOTÕES */}

              <div
                className="
                  mt-6
                  flex
                  flex-wrap
                  gap-3
                "
              >

                <Link
                  to="/historico"
                  className="
                    inline-flex
                    items-center
                    gap-2

                    rounded-lg

                    bg-slate-900

                    px-4
                    py-2.5

                    text-sm
                    font-semibold
                    text-white

                    transition-colors

                    hover:bg-slate-800
                  "
                >

                  <Syringe size={16} />

                  Consultar vacinas

                </Link>


                <Link
                  to="/certificado"
                  className="
                    inline-flex
                    items-center
                    gap-2

                    rounded-lg

                    border
                    border-slate-200

                    bg-white

                    px-4
                    py-2.5

                    text-sm
                    font-semibold
                    text-slate-700

                    transition-colors

                    hover:bg-slate-50
                    hover:text-slate-950
                  "
                >

                  <FileText size={16} />

                  Emitir certificado

                </Link>

              </div>

            </div>


            {/* ==================================================
                SITUAÇÃO VACINAL
               ================================================== */}

            <div
              className="
                border-t
                border-slate-200

                bg-slate-50/70

                p-6

                lg:border-l
                lg:border-t-0

                md:p-8
              "
            >

              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-slate-400
                "
              >
                Situação vacinal
              </p>


              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-4
                "
              >

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center

                    rounded-lg

                    bg-emerald-100
                    text-emerald-700
                  "
                >
                  <ShieldCheck size={22} />
                </div>


                <div>

                  <p
                    className="
                      text-lg
                      font-bold
                      text-slate-950
                    "
                  >
                    Em dia
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-500
                    "
                  >
                    Nenhuma pendência registrada
                  </p>

                </div>

              </div>


              {/* DIVISOR */}

              <div
                className="
                  my-6
                  h-px
                  bg-slate-200
                "
              />


              {/* COBERTURA */}

              <div
                className="
                  flex
                  items-end
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-xs
                      font-medium
                      text-slate-500
                    "
                  >
                    Cobertura registrada
                  </p>

                  <p
                    className="
                      mt-1
                      text-3xl
                      font-bold
                      tracking-tight
                      text-slate-950
                    "
                  >
                    100%
                  </p>

                </div>


                <span
                  className="
                    rounded-md
                    bg-emerald-50
                    px-2
                    py-1

                    text-[11px]
                    font-semibold
                    text-emerald-700
                  "
                >
                  Atualizada
                </span>

              </div>


              {/* BARRA */}

              <div
                className="
                  mt-4
                  h-1.5
                  overflow-hidden
                  rounded-full
                  bg-slate-200
                "
              >

                <div
                  className="
                    h-full
                    w-full
                    rounded-full
                    bg-emerald-600
                  "
                />

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            RESUMO DA CADERNETA
           ==================================================== */}

        <section className="mb-8">

          <div
            className="
              mb-4
              flex
              items-end
              justify-between
            "
          >

            <div>

              <h2
                className="
                  text-base
                  font-semibold
                  text-slate-950
                "
              >
                Resumo da caderneta
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500
                "
              >
                Informações principais da sua vacinação.
              </p>

            </div>


            <Link
              to="/historico"
              className="
                hidden
                items-center
                gap-1

                text-xs
                font-semibold
                text-slate-600

                hover:text-slate-950

                sm:flex
              "
            >
              Ver histórico

              <ArrowRight size={14} />
            </Link>

          </div>


          {/* CARDS DE RESUMO */}

          <div
            className="
              grid
              grid-cols-1

              overflow-hidden

              rounded-xl

              border
              border-slate-200

              bg-white

              shadow-sm

              md:grid-cols-3
            "
          >


            {/* COBERTURA */}

            <div
              className="
                flex
                items-center
                gap-4

                border-b
                border-slate-200

                p-5

                md:border-b-0
                md:border-r
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center

                  rounded-lg

                  bg-emerald-50
                  text-emerald-700
                "
              >
                <ShieldCheck size={19} />
              </div>


              <div>

                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-500
                  "
                >
                  Cobertura vacinal
                </p>

                <p
                  className="
                    mt-0.5
                    text-xl
                    font-bold
                    text-slate-950
                  "
                >
                  100%
                </p>

              </div>

            </div>


            {/* STATUS */}

            <div
              className="
                flex
                items-center
                gap-4

                border-b
                border-slate-200

                p-5

                md:border-b-0
                md:border-r
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center

                  rounded-lg

                  bg-blue-50
                  text-blue-700
                "
              >
                <CheckCircle2 size={19} />
              </div>


              <div>

                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-500
                  "
                >
                  Situação
                </p>

                <p
                  className="
                    mt-0.5
                    text-xl
                    font-bold
                    text-slate-950
                  "
                >
                  Em dia
                </p>

              </div>

            </div>


            {/* PRÓXIMA DOSE */}

            <div
              className="
                flex
                items-center
                gap-4
                p-5
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center

                  rounded-lg

                  bg-slate-100
                  text-slate-700
                "
              >
                <CalendarDays size={19} />
              </div>


              <div>

                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-500
                  "
                >
                  Próxima dose
                </p>

                <p
                  className="
                    mt-0.5
                    text-base
                    font-bold
                    text-slate-950
                  "
                >
                  Nenhuma pendência
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            SERVIÇOS
           ==================================================== */}

        <section className="mb-8">

          <div className="mb-4">

            <h2
              className="
                text-base
                font-semibold
                text-slate-950
              "
            >
              Serviços
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-slate-500
              "
            >
              Acesse rapidamente os recursos da plataforma.
            </p>

          </div>


          <div
            className="
              grid
              grid-cols-1
              gap-4

              md:grid-cols-2
              xl:grid-cols-4
            "
          >


            {/* ==================================================
                HISTÓRICO
               ================================================== */}

            <Link
              to="/historico"
              className="
                group

                rounded-xl

                border
                border-slate-200

                bg-white

                p-5

                shadow-sm

                transition-all

                hover:-translate-y-0.5
                hover:border-slate-300
                hover:shadow-md
              "
            >

              <div
                className="
                  mb-5
                  flex
                  items-start
                  justify-between
                "
              >

                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center

                    rounded-lg

                    bg-emerald-50
                    text-emerald-700
                  "
                >
                  <Syringe size={19} />
                </div>


                <ArrowRight
                  size={16}
                  className="
                    text-slate-300
                    transition-all

                    group-hover:translate-x-1
                    group-hover:text-slate-600
                  "
                />

              </div>


              <h3
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                "
              >
                Histórico de vacinação
              </h3>


              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Consulte aplicações, datas, lotes,
                fabricantes e próximas doses.
              </p>

            </Link>


            {/* ==================================================
                CERTIFICADO
               ================================================== */}

            <Link
              to="/certificado"
              className="
                group

                rounded-xl

                border
                border-slate-200

                bg-white

                p-5

                shadow-sm

                transition-all

                hover:-translate-y-0.5
                hover:border-slate-300
                hover:shadow-md
              "
            >

              <div
                className="
                  mb-5
                  flex
                  items-start
                  justify-between
                "
              >

                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center

                    rounded-lg

                    bg-blue-50
                    text-blue-700
                  "
                >
                  <FileText size={19} />
                </div>


                <ArrowRight
                  size={16}
                  className="
                    text-slate-300
                    transition-all

                    group-hover:translate-x-1
                    group-hover:text-slate-600
                  "
                />

              </div>


              <h3
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                "
              >
                Certificado
              </h3>


              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Acesse seu comprovante digital de
                vacinação e opções de emissão.
              </p>

            </Link>


            {/* ==================================================
                POSTOS
               ================================================== */}

            <Link
              to="/postos"
              className="
                group

                rounded-xl

                border
                border-slate-200

                bg-white

                p-5

                shadow-sm

                transition-all

                hover:-translate-y-0.5
                hover:border-slate-300
                hover:shadow-md
              "
            >

              <div
                className="
                  mb-5
                  flex
                  items-start
                  justify-between
                "
              >

                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center

                    rounded-lg

                    bg-slate-100
                    text-slate-700
                  "
                >
                  <MapPin size={19} />
                </div>


                <ArrowRight
                  size={16}
                  className="
                    text-slate-300
                    transition-all

                    group-hover:translate-x-1
                    group-hover:text-slate-600
                  "
                />

              </div>


              <h3
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                "
              >
                Postos de saúde
              </h3>


              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Consulte unidades de atendimento e
                informações dos postos cadastrados.
              </p>

            </Link>


            {/* ==================================================
                PERFIL
               ================================================== */}

            <Link
              to="/perfil"
              className="
                group

                rounded-xl

                border
                border-slate-200

                bg-white

                p-5

                shadow-sm

                transition-all

                hover:-translate-y-0.5
                hover:border-slate-300
                hover:shadow-md
              "
            >

              <div
                className="
                  mb-5
                  flex
                  items-start
                  justify-between
                "
              >

                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center

                    rounded-lg

                    bg-violet-50
                    text-violet-700
                  "
                >
                  <User size={19} />
                </div>


                <ArrowRight
                  size={16}
                  className="
                    text-slate-300
                    transition-all

                    group-hover:translate-x-1
                    group-hover:text-slate-600
                  "
                />

              </div>


              <h3
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                "
              >
                Dados pessoais
              </h3>


              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Consulte e gerencie as informações
                vinculadas à sua conta.
              </p>

            </Link>

          </div>

        </section>


        {/* ====================================================
            DEPENDENTES
           ==================================================== */}

        <section
          className="
            flex
            flex-col
            justify-between
            gap-5

            rounded-xl

            border
            border-slate-200

            bg-white

            p-5

            shadow-sm

            md:flex-row
            md:items-center
          "
        >

          <div className="flex items-start gap-4">

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center

                rounded-lg

                bg-slate-100
                text-slate-700
              "
            >
              <User size={19} />
            </div>


            <div>

              <h2
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                "
              >
                Dependentes
              </h2>


              <p
                className="
                  mt-1
                  max-w-2xl
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Adicione familiares à sua conta para
                acompanhar as informações de vacinação
                em um único lugar.
              </p>

            </div>

          </div>


          <Link
            to="/adicionar-dependente"
            className="
              inline-flex
              shrink-0
              items-center
              justify-center
              gap-2

              rounded-lg

              border
              border-slate-300

              bg-white

              px-4
              py-2.5

              text-xs
              font-semibold
              text-slate-700

              transition-colors

              hover:bg-slate-50
              hover:text-slate-950
            "
          >

            <Plus size={15} />

            Adicionar dependente

          </Link>

        </section>

      </div>

    </div>

  );
}