import { useEffect, useState } from 'react';

import {
  Search,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Syringe,
  Database,
  ChevronRight,
} from 'lucide-react';


/*
  ============================================================
  INTERFACE DA VACINA
  ============================================================
  Representa os dados recebidos do backend.
*/
interface Vacina {
  id: number;
  nome: string;
  dataAplicacao: string;
  lote: string;
  fabricante: string;
  proximaDose: string;
}


export default function Historico() {

  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);


  // ==========================================================
  // ENDEREÇO DA API
  // ==========================================================

  // Em produção utilizará VITE_API_URL.
  // Localmente continuará funcionando na porta 5000.
  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000';


  // ==========================================================
  // BUSCAR VACINAS
  // ==========================================================

  useEffect(() => {

    const usuarioId = localStorage.getItem('usuarioId');

    if (!usuarioId) {
      setCarregando(false);
      return;
    }


    fetch(`${API_URL}/api/vacinas/${usuarioId}`)

      .then((res) => res.json())

      .then((data) => {

        if (data.sucesso) {
          setVacinas(data.dados);
        }

        setCarregando(false);

      })

      .catch((erro) => {

        console.error('Erro ao buscar vacinas:', erro);
        setCarregando(false);

      });

  }, [API_URL]);


  // ==========================================================
  // FILTRO DA PESQUISA
  // ==========================================================

  const vacinasFiltradas = vacinas.filter((vacina) =>
    vacina.nome
      .toLowerCase()
      .includes(busca.toLowerCase())
  );


  // ==========================================================
  // CONTADORES
  // ==========================================================

  const vacinasComRetorno = vacinas.filter(
    (vacina) => vacina.proximaDose
  ).length;

  const vacinasConcluidas =
    vacinas.length - vacinasComRetorno;


  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (

    <div
      className="
        min-h-full
        bg-slate-50
        text-slate-900
      "
    >

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

              <span>Caderneta digital</span>

              <ChevronRight size={13} />

              <span className="text-slate-700">
                Vacinação
              </span>

            </div>


            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                text-slate-950

                md:text-[34px]
              "
            >
              Histórico de vacinação
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
              Consulte os imunizantes registrados,
              datas de aplicação, lotes, fabricantes
              e informações sobre próximas doses.
            </p>

          </div>


          {/* STATUS DO SISTEMA */}

          <div
            className="
              flex
              items-center
              gap-3

              rounded-lg

              border
              border-slate-200

              bg-white

              px-4
              py-3

              shadow-sm
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-md

                bg-emerald-50
                text-emerald-700
              "
            >
              <Database size={18} />
            </div>


            <div>

              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                Base de dados
              </p>

              <div
                className="
                  mt-0.5
                  flex
                  items-center
                  gap-2

                  text-xs
                  font-semibold
                  text-slate-700
                "
              >

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-emerald-500
                  "
                />

                Sincronizada

              </div>

            </div>

          </div>

        </header>


        {/* ====================================================
            RESUMO
           ==================================================== */}

        <section
          className="
            mb-7
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


          {/* TOTAL */}

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
                items-center
                justify-center

                rounded-lg

                bg-slate-100
                text-slate-700
              "
            >
              <Syringe size={19} />
            </div>


            <div>

              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                "
              >
                Registros
              </p>

              <p
                className="
                  mt-0.5
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-950
                "
              >
                {vacinas.length}
              </p>

            </div>

          </div>


          {/* CONCLUÍDAS */}

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
                items-center
                justify-center

                rounded-lg

                bg-emerald-50
                text-emerald-700
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
                Sem retorno informado
              </p>

              <p
                className="
                  mt-0.5
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-950
                "
              >
                {vacinasConcluidas}
              </p>

            </div>

          </div>


          {/* PRÓXIMAS DOSES */}

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
                items-center
                justify-center

                rounded-lg

                bg-amber-50
                text-amber-700
              "
            >
              <Clock3 size={19} />
            </div>


            <div>

              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                "
              >
                Com retorno
              </p>

              <p
                className="
                  mt-0.5
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-950
                "
              >
                {vacinasComRetorno}
              </p>

            </div>

          </div>

        </section>


        {/* ====================================================
            CONTEÚDO PRINCIPAL
           ==================================================== */}

        <section
          className="
            overflow-hidden

            rounded-xl

            border
            border-slate-200

            bg-white

            shadow-sm
          "
        >


          {/* ==================================================
              CABEÇALHO DA TABELA
             ================================================== */}

          <div
            className="
              flex
              flex-col
              justify-between
              gap-4

              border-b
              border-slate-200

              px-5
              py-5

              md:flex-row
              md:items-center
            "
          >

            <div>

              <h2
                className="
                  text-base
                  font-semibold
                  text-slate-900
                "
              >
                Registros de imunização
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500
                "
              >
                {vacinasFiltradas.length}{' '}
                {vacinasFiltradas.length === 1
                  ? 'registro encontrado'
                  : 'registros encontrados'}
              </p>

            </div>


            {/* PESQUISA */}

            <div
              className="
                relative
                w-full

                md:w-80
              "
            >

              <Search
                size={17}
                className="
                  absolute
                  left-3.5
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />


              <input
                type="text"
                value={busca}
                onChange={(e) =>
                  setBusca(e.target.value)
                }
                placeholder="Buscar por imunizante"
                className="
                  w-full

                  rounded-lg

                  border
                  border-slate-200

                  bg-white

                  py-2.5
                  pl-10
                  pr-4

                  text-sm
                  text-slate-700

                  outline-none

                  transition

                  placeholder:text-slate-400

                  focus:border-emerald-600
                  focus:ring-2
                  focus:ring-emerald-600/10
                "
              />

            </div>

          </div>


          {/* ==================================================
              CARREGAMENTO
             ================================================== */}

          {carregando ? (

            <div
              className="
                flex
                min-h-[300px]
                items-center
                justify-center
              "
            >

              <div className="text-center">

                <div
                  className="
                    mx-auto
                    mb-4

                    h-7
                    w-7

                    animate-spin

                    rounded-full

                    border-2
                    border-slate-200
                    border-t-emerald-600
                  "
                />

                <p
                  className="
                    text-sm
                    font-medium
                    text-slate-500
                  "
                >
                  Carregando registros...
                </p>

              </div>

            </div>

          ) : (


            /* =================================================
               TABELA
               ================================================= */

            <div className="overflow-x-auto">

              <table
                className="
                  w-full
                  border-collapse
                  text-left
                "
              >

                <thead>

                  <tr
                    className="
                      border-b
                      border-slate-200

                      bg-slate-50/80

                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-500
                    "
                  >

                    <th className="px-6 py-4">
                      Imunizante
                    </th>

                    <th className="px-6 py-4">
                      Aplicação
                    </th>

                    <th className="px-6 py-4">
                      Lote
                    </th>

                    <th className="px-6 py-4">
                      Fabricante
                    </th>

                    <th className="px-6 py-4">
                      Situação
                    </th>

                  </tr>

                </thead>


                <tbody
                  className="
                    divide-y
                    divide-slate-100
                  "
                >

                  {vacinasFiltradas.length > 0 ? (

                    vacinasFiltradas.map((vacina) => (

                      <tr
                        key={vacina.id}
                        className="
                          transition-colors
                          hover:bg-slate-50/70
                        "
                      >


                        {/* VACINA */}

                        <td className="px-6 py-5">

                          <div
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

                                border
                                border-slate-200

                                bg-slate-50

                                text-slate-600
                              "
                            >
                              <Syringe size={17} />
                            </div>


                            <span
                              className="
                                text-sm
                                font-semibold
                                text-slate-900
                              "
                            >
                              {vacina.nome}
                            </span>

                          </div>

                        </td>


                        {/* DATA */}

                        <td
                          className="
                            px-6
                            py-5

                            text-sm
                            text-slate-600
                          "
                        >

                          <div
                            className="
                              flex
                              items-center
                              gap-2
                            "
                          >

                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />

                            {vacina.dataAplicacao}

                          </div>

                        </td>


                        {/* LOTE */}

                        <td
                          className="
                            px-6
                            py-5

                            font-mono
                            text-xs
                            text-slate-500
                          "
                        >
                          {vacina.lote || '—'}
                        </td>


                        {/* FABRICANTE */}

                        <td
                          className="
                            px-6
                            py-5

                            text-sm
                            text-slate-600
                          "
                        >
                          {vacina.fabricante ||
                            'Não informado'}
                        </td>


                        {/* STATUS */}

                        <td className="px-6 py-5">

                          {vacina.proximaDose ? (

                            <div
                              className="
                                inline-flex
                                items-center
                                gap-2

                                rounded-md

                                border
                                border-amber-200

                                bg-amber-50

                                px-2.5
                                py-1.5

                                text-xs
                                font-medium
                                text-amber-800
                              "
                            >

                              <Clock3 size={14} />

                              Próxima: {vacina.proximaDose}

                            </div>

                          ) : (

                            <div
                              className="
                                inline-flex
                                items-center
                                gap-2

                                rounded-md

                                border
                                border-emerald-200

                                bg-emerald-50

                                px-2.5
                                py-1.5

                                text-xs
                                font-medium
                                text-emerald-800
                              "
                            >

                              <CheckCircle2 size={14} />

                              Sem retorno

                            </div>

                          )}

                        </td>

                      </tr>

                    ))

                  ) : (


                    /* ==========================================
                       NENHUM RESULTADO
                       ========================================== */

                    <tr>

                      <td
                        colSpan={5}
                        className="
                          px-6
                          py-20
                          text-center
                        "
                      >

                        <div
                          className="
                            mx-auto
                            mb-4

                            flex
                            h-11
                            w-11

                            items-center
                            justify-center

                            rounded-lg

                            bg-slate-100

                            text-slate-400
                          "
                        >
                          <Syringe size={21} />
                        </div>


                        <p
                          className="
                            font-semibold
                            text-slate-700
                          "
                        >
                          {busca
                            ? 'Nenhum registro encontrado'
                            : 'Nenhuma vacina registrada'}
                        </p>


                        <p
                          className="
                            mx-auto
                            mt-1
                            max-w-sm

                            text-sm
                            leading-6
                            text-slate-500
                          "
                        >

                          {busca
                            ? 'Tente pesquisar utilizando outro nome de imunizante.'
                            : 'Os registros de vacinação vinculados à sua conta aparecerão aqui.'}

                        </p>

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </div>

  );

}