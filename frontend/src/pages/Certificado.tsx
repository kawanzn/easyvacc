import { useEffect, useState } from 'react';

import {
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  QrCode,
  ShieldCheck,
  Syringe,
} from 'lucide-react';
import { API_URL } from '../lib/api';


/*
  ============================================================
  TIPOS
  ============================================================
*/

interface Vacina {
  id: number;
  nome: string;
  dataAplicacao: string;
  lote: string;
  fabricante: string;
  proximaDose: string;
}

interface Usuario {
  nome: string;
  cpf: string;
}


/*
  ============================================================
  CERTIFICADO
  ============================================================
*/

export default function Certificado() {

  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [usuario, setUsuario] = useState<Usuario>({
    nome: '',
    cpf: '',
  });

  const [vacinas, setVacinas] = useState<Vacina[]>([]);

  const [carregando, setCarregando] = useState(() => Boolean(localStorage.getItem('usuarioId')));


  // ==========================================================
  // API
  // ==========================================================

  // ==========================================================
  // DATA DE EMISSÃO
  // ==========================================================

  const dataEmissao = new Date().toLocaleString('pt-BR');


  // ==========================================================
  // BUSCAR DADOS
  // ==========================================================

  useEffect(() => {

    const usuarioId = localStorage.getItem('usuarioId');

    if (!usuarioId) {
      return;
    }


    /*
      Promise.all permite buscar usuário e vacinas
      ao mesmo tempo.
    */

    Promise.all([

      fetch(`${API_URL}/api/usuarios/${usuarioId}`)
        .then((res) => res.json()),

      fetch(`${API_URL}/api/vacinas/${usuarioId}`)
        .then((res) => res.json()),

    ])

      .then(([dadosUsuario, dadosVacinas]) => {

        if (dadosUsuario.sucesso) {
          setUsuario(dadosUsuario.dados);
        }

        if (dadosVacinas.sucesso) {
          setVacinas(dadosVacinas.dados);
        }

      })

      .catch((erro) => {

        console.error(
          'Erro ao gerar certificado:',
          erro
        );

      })

      .finally(() => {
        setCarregando(false);
      });

  }, []);


  // ==========================================================
  // IMPRIMIR / GERAR PDF
  // ==========================================================

  const gerarPDF = () => {
    window.print();
  };


  // ==========================================================
  // CARREGAMENTO
  // ==========================================================

  if (carregando) {

    return (

      <div
        className="
          flex
          min-h-[70vh]
          items-center
          justify-center
          bg-[#090d16]
        "
      >

        <div className="text-center">

          <Loader2
            size={28}
            className="
              mx-auto
              animate-spin
              text-emerald-400
            "
          />

          <p
            className="
              mt-3
              text-sm
              font-medium
              text-slate-400
            "
          >
            Preparando documento...
          </p>

        </div>

      </div>

    );

  }


  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (

    <div
      className="
        min-h-full
        bg-[#090d16]
        text-slate-100

        print:bg-white
        print:text-slate-900
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

          print:max-w-none
          print:p-0
        "
      >


        {/* ====================================================
            CABEÇALHO DA PÁGINA
            ==================================================== */}

        <header
          className="
            mb-8

            flex
            flex-col
            justify-between
            gap-5

            border-b
            border-slate-800

            pb-7

            lg:flex-row
            lg:items-end

            print:hidden
          "
        >

          <div>

            {/* BREADCRUMB */}

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

                text-slate-400
              "
            >

              <span>
                Caderneta digital
              </span>

              <ChevronRight size={13} />

              <span className="text-emerald-400">
                Certificado
              </span>

            </div>


            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                text-white

                md:text-[34px]
              "
            >
              Certificado de vacinação
            </h1>


            <p
              className="
                mt-2
                max-w-2xl

                text-sm
                leading-6
                text-slate-400
              "
            >
              Visualize seus registros de imunização
              em um documento organizado e gere uma
              versão em PDF para consulta.
            </p>

          </div>


          {/* BOTÃO DE DOWNLOAD */}

          <button
            onClick={gerarPDF}
            className="
              inline-flex
              items-center
              justify-center
              gap-2

              rounded-lg

              bg-emerald-500

              px-4
              py-2.5

              text-sm
              font-semibold
              text-slate-950

              shadow-sm

              transition-colors

              hover:bg-emerald-400
            "
          >

            <Download size={17} />

            Gerar PDF

          </button>

        </header>


        {/* ====================================================
            INFORMAÇÕES SOBRE O DOCUMENTO
            ==================================================== */}

        <section
          className="
            mb-6

            grid
            grid-cols-1
            gap-4

            md:grid-cols-3

            print:hidden
          "
        >


          {/* DOCUMENTO */}

          <div
            className="
              rounded-xl

              border
              border-slate-800

              bg-[#111827]

              p-5

              shadow-sm
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center

                  rounded-lg

                  bg-slate-800
                  text-slate-300
                "
              >
                <FileText size={18} />
              </div>


              <div>

                <p
                  className="
                    text-[11px]
                    font-medium
                    text-slate-400
                  "
                >
                  Tipo de documento
                </p>

                <p
                  className="
                    mt-0.5
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Comprovante de vacinação
                </p>

              </div>

            </div>

          </div>


          {/* REGISTROS */}

          <div
            className="
              rounded-xl

              border
              border-slate-800

              bg-[#111827]

              p-5

              shadow-sm
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center

                  rounded-lg

                  bg-emerald-950/60
                  text-emerald-400
                "
              >
                <Syringe size={18} />
              </div>


              <div>

                <p
                  className="
                    text-[11px]
                    font-medium
                    text-slate-400
                  "
                >
                  Registros incluídos
                </p>

                <p
                  className="
                    mt-0.5
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  {vacinas.length}{' '}
                  {vacinas.length === 1
                    ? 'vacina'
                    : 'vacinas'}
                </p>

              </div>

            </div>

          </div>


          {/* STATUS */}

          <div
            className="
              rounded-xl

              border
              border-slate-800

              bg-[#111827]

              p-5

              shadow-sm
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center

                  rounded-lg

                  bg-cyan-950/60
                  text-cyan-400
                "
              >
                <CheckCircle2 size={18} />
              </div>


              <div>

                <p
                  className="
                    text-[11px]
                    font-medium
                    text-slate-400
                  "
                >
                  Fonte dos dados
                </p>

                <p
                  className="
                    mt-0.5
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Caderneta EasyVacc
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            DOCUMENTO
            ==================================================== */}

        <section
          className="
            mx-auto
            max-w-5xl

            overflow-hidden

            border
            border-slate-800

            bg-[#111827]

            shadow-2xl

            print:max-w-none
            print:border-0
            print:bg-white
            print:shadow-none
          "
        >


          {/* =================================================-
              CABEÇALHO DO DOCUMENTO
              ================================================== */}

          <div
            className="
              border-b
              border-slate-800

              px-8
              py-7

              md:px-10

              print:px-0
              print:pt-0
              print:border-slate-200
            "
          >

            <div
              className="
                flex
                flex-col
                justify-between
                gap-5

                sm:flex-row
                sm:items-center
              "
            >


              {/* MARCA */}

              <div className="flex items-center gap-4">

                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center

                    rounded-lg

                    border
                    border-slate-800

                    bg-[#090d16]
                    print:bg-white
                    print:border-slate-200
                  "
                >

                  <img
                    src="/logo.png"
                    alt="EasyVacc"
                    className="
                   mx-auto flex 
                   items-center 
                   justify-center
                    rounded-lg
                     bg-white p-1.5
                      shadow-sm
                      h-12
                      w-12
                      object-contain
                    "
                  />

                </div>


                <div>

                  <h2
                    className="
                      text-xl
                      font-bold
                      tracking-tight
                      text-white
                      print:text-[#0b2239]
                    "
                  >
                    Easy
                    <span className="text-emerald-400 print:text-emerald-600">
                      Vacc
                    </span>
                  </h2>


                  <p
                    className="
                      mt-0.5
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.15em]
                      text-slate-400
                    "
                  >
                    Caderneta digital de vacinação
                  </p>

                </div>

              </div>


              {/* TIPO */}

              <div
                className="
                  sm:text-right
                "
              >

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.14em]
                    text-slate-400
                  "
                >
                  Documento
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-bold
                    text-white
                    print:text-slate-900
                  "
                >
                  Comprovante de vacinação
                </p>

              </div>

            </div>

          </div>


          {/* =================================================-
              CORPO
              ================================================== */}

          <div
            className="
              px-8
              py-8

              md:px-10

              print:px-0
            "
          >


            {/* =================================================-
                IDENTIFICAÇÃO
                ================================================== */}

            <section className="mb-9">

              <div
                className="
                  mb-4
                  flex
                  items-center
                  gap-2
                "
              >

                <div
                  className="
                    h-4
                    w-1
                    rounded-full
                    bg-emerald-500
                  "
                />

                <h3
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.12em]
                    text-slate-300
                    print:text-slate-700
                  "
                >
                  Identificação do titular
                </h3>

              </div>


              <div
                className="
                  grid
                  grid-cols-1

                  border
                  border-slate-800
                  print:border-slate-200

                  md:grid-cols-[2fr_1fr]
                "
              >


                {/* NOME */}

                <div
                  className="
                    border-b
                    border-slate-800
                    print:border-slate-200

                    p-4

                    md:border-b-0
                    md:border-r
                  "
                >

                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Nome completo
                  </p>

                  <p
                    className="
                      mt-1.5
                      text-sm
                      font-semibold
                      text-white
                      print:text-slate-900
                    "
                  >
                    {usuario.nome ||
                      'Não informado'}
                  </p>

                </div>


                {/* CPF */}

                <div className="p-4">

                  <p
                    className="
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    CPF
                  </p>

                  <p
                    className="
                      mt-1.5
                      text-sm
                      font-semibold
                      text-white
                      print:text-slate-900
                    "
                  >
                    {usuario.cpf ||
                      'Não informado'}
                  </p>

                </div>

              </div>

            </section>


            {/* =================================================-
                REGISTROS DE VACINAÇÃO
                ================================================== */}

            <section>

              <div
                className="
                  mb-4
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  <div
                    className="
                      h-4
                      w-1
                      rounded-full
                      bg-emerald-500
                    "
                  />

                  <h3
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-slate-300
                      print:text-slate-700
                    "
                  >
                    Registros de imunização
                  </h3>

                </div>


                <span
                  className="
                    text-[10px]
                    font-medium
                    text-slate-400
                  "
                >
                  {vacinas.length} registro(s)
                </span>

              </div>


              {/* ================================================
                  TABELA
                  ================================================ */}

              {vacinas.length > 0 ? (

                <div
                  className="
                    overflow-x-auto
                    border
                    border-slate-800
                    print:border-slate-200
                  "
                >

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
                          border-slate-800
                          print:border-slate-200
                          bg-[#090d16]
                          print:bg-white

                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-wider
                          text-slate-400
                        "
                      >

                        <th className="px-4 py-3">
                          Imunizante
                        </th>

                        <th className="px-4 py-3">
                          Fabricante
                        </th>

                        <th className="px-4 py-3">
                          Aplicação
                        </th>

                        <th className="px-4 py-3">
                          Lote
                        </th>

                      </tr>

                    </thead>


                    <tbody
                      className="
                        divide-y
                        divide-slate-800
                        print:divide-slate-200
                      "
                    >

                      {vacinas.map((vacina) => (

                        <tr key={vacina.id}>

                          <td
                            className="
                              px-4
                              py-4

                              text-xs
                              font-semibold
                              text-white
                              print:text-slate-900
                            "
                          >
                            {vacina.nome}
                          </td>


                          <td
                            className="
                              px-4
                              py-4

                              text-xs
                              text-slate-300
                              print:text-slate-600
                            "
                          >
                            {vacina.fabricante ||
                              'Não informado'}
                          </td>


                          <td
                            className="
                              whitespace-nowrap

                              px-4
                              py-4

                              text-xs
                              text-slate-300
                              print:text-slate-600
                            "
                          >
                            {vacina.dataAplicacao}
                          </td>


                          <td
                            className="
                              px-4
                              py-4

                              font-mono
                              text-[11px]
                              text-slate-400
                            "
                          >
                            {vacina.lote || '—'}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              ) : (

                <div
                  className="
                    border
                    border-dashed
                    border-slate-800
                    print:border-slate-300

                    px-6
                    py-10

                    text-center
                  "
                >

                  <Syringe
                    size={22}
                    className="
                      mx-auto
                      text-slate-600
                    "
                  />

                  <p
                    className="
                      mt-3
                      text-sm
                      font-medium
                      text-slate-300
                      print:text-slate-600
                    "
                  >
                    Nenhum registro de vacinação
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-400
                    "
                  >
                    Não existem doses vinculadas a este
                    usuário no momento da emissão.
                  </p>

                </div>

              )}

            </section>


            {/* =================================================-
                RODAPÉ
                ================================================== */}

            <footer
              className="
                mt-10

                flex
                flex-col
                justify-between
                gap-6

                border-t
                border-slate-800
                print:border-slate-200

                pt-6

                sm:flex-row
                sm:items-end
              "
            >


              {/* INFORMAÇÕES */}

              <div>

                <div
                  className="
                    mb-3
                    flex
                    items-center
                    gap-2
                  "
                >

                  <ShieldCheck
                    size={16}
                    className="text-emerald-400 print:text-emerald-600"
                  />

                  <span
                    className="
                      text-xs
                      font-semibold
                      text-slate-200
                      print:text-slate-700
                    "
                  >
                    Documento gerado pelo EasyVacc
                  </span>

                </div>


                <p
                  className="
                    text-[10px]
                    leading-5
                    text-slate-400
                  "
                >
                  Emitido eletronicamente em
                </p>

                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-300
                    print:text-slate-600
                  "
                >
                  {dataEmissao}
                </p>

              </div>


              {/* QR CODE VISUAL */}

              <div
                className="
                  flex
                  items-end
                  gap-3
                "
              >

                <div className="text-right">

                  <p
                    className="
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Validação
                  </p>

                  <p
                    className="
                      mt-1
                      max-w-[150px]
                      text-[10px]
                      leading-4
                      text-slate-400
                    "
                  >
                    Área reservada para código
                    de verificação.
                  </p>

                </div>


                <div
                  className="
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center

                    border
                    border-slate-700
                    print:border-slate-300

                    bg-[#090d16]
                    print:bg-white

                    text-slate-400
                  "
                >
                  <QrCode size={35} />
                </div>

              </div>

            </footer>

          </div>

        </section>


        {/* ====================================================
            AVISO
            ==================================================== */}

        <p
          className="
            mx-auto
            mt-4
            max-w-5xl

            text-center
            text-[10px]
            leading-5
            text-slate-400

            print:hidden
          "
        >
          O conteúdo deste documento corresponde aos
          registros disponíveis na plataforma EasyVacc
          no momento da emissão.
        </p>

      </div>

    </div>

  );

}