import { useEffect, useState } from 'react';



import {

  CheckCircle2,

  ChevronRight,

  Download,

  FileText,

  Loader2,


  ShieldCheck,

  Syringe,

} from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../services/supabase';
import { lerPessoaAtiva, type PessoaAtiva } from '../lib/brasil';





/*

  ============================================================

  TIPOS

  ============================================================

*/



interface Vacina {
  id: number;
  nome: string;
  data_aplicacao: string;
  lote: string | null;
  fabricante: string | null;
  proxima_dose: string | null;
  posto: string | null;
  profissional: string | null;
}

interface Usuario {
  nome: string;
  cpf: string;
}

interface DependenteBanco {
  id: number;
  nome: string;
  parentesco: string | null;
  data_nascimento: string | null;
}

interface CertificadoBanco {
  codigo: string;
  emitido_em: string;
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
  const [pessoaAtiva, setPessoaAtiva] = useState<PessoaAtiva | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [codigoCertificado, setCodigoCertificado] = useState('');
  const [emitidoEm, setEmitidoEm] = useState('');


  // ==========================================================

  // DATA DE EMISSÃO

  // ==========================================================



  const dataEmissao = emitidoEm
    ? new Date(emitidoEm).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR');

  const urlValidacao = codigoCertificado
    ? `${window.location.origin}/validar/${codigoCertificado}`
    : '';





  // ==========================================================
  // CERTIFICADO VERIFICÁVEL
  // ==========================================================

  async function obterOuCriarCertificado(
    usuarioId: string,
    dependenteId: number | null
  ) {
    let consulta = supabase
      .from('certificados')
      .select('codigo, emitido_em')
      .eq('usuario_id', usuarioId)
      .eq('valido', true)
      .order('emitido_em', { ascending: false })
      .limit(1);

    consulta = dependenteId === null
      ? consulta.is('dependente_id', null)
      : consulta.eq('dependente_id', dependenteId);

    const { data: existentes, error: erroConsulta } = await consulta;

    if (erroConsulta) {
      throw new Error(`Não foi possível consultar o certificado: ${erroConsulta.message}`);
    }

    let certificado = (existentes?.[0] ?? null) as CertificadoBanco | null;

    if (!certificado) {
      const { data: novo, error: erroCriacao } = await supabase
        .from('certificados')
        .insert({
          usuario_id: usuarioId,
          dependente_id: dependenteId,
        })
        .select('codigo, emitido_em')
        .single();

      if (erroCriacao || !novo) {
        throw new Error(
          `Não foi possível emitir o certificado: ${erroCriacao?.message ?? 'erro desconhecido'}`
        );
      }

      certificado = novo as CertificadoBanco;
    }

    setCodigoCertificado(certificado.codigo);
    setEmitidoEm(certificado.emitido_em);
  }

  // ==========================================================
  // BUSCAR DADOS NO SUPABASE
  // ==========================================================

  useEffect(() => {
    async function carregarCertificado() {
      try {
        setCarregando(true);
        setErro('');

        const { data: { user }, error: erroAuth } = await supabase.auth.getUser();
        if (erroAuth || !user) throw new Error('Usuário não autenticado.');

        const { data: titular, error: erroTitular } = await supabase
          .from('users')
          .select('id, nome, cpf')
          .eq('id', user.id)
          .single();

        if (erroTitular || !titular) {
          console.error('Erro ao buscar titular:', erroTitular);
          throw new Error('Não foi possível carregar os dados do titular.');
        }

        const ativaSalva = lerPessoaAtiva();
        let ativa: PessoaAtiva = ativaSalva ?? {
          id: user.id,
          nome: titular.nome ?? 'Titular',
          tipo: 'titular',
        };

        if (ativa.tipo === 'titular' && String(ativa.id) !== user.id) {
          ativa = { id: user.id, nome: titular.nome ?? 'Titular', tipo: 'titular' };
        }

        if (ativa.tipo === 'titular') {
          setPessoaAtiva(ativa);
          setUsuario({ nome: titular.nome ?? 'Não informado', cpf: titular.cpf ?? '' });

          const { data: dadosVacinas, error: erroVacinas } = await supabase
            .from('vacinas')
            .select('id, nome, data_aplicacao, lote, fabricante, proxima_dose, posto, profissional')
            .eq('usuario_id', user.id)
            .is('dependente_id', null)
            .eq('status', 'ativo')
            .order('data_aplicacao', { ascending: false });

          if (erroVacinas) throw new Error(`Não foi possível carregar as vacinas: ${erroVacinas.message}`);
          setVacinas((dadosVacinas ?? []) as Vacina[]);
          await obterOuCriarCertificado(user.id, null);
          return;
        }

        const dependenteId = Number(ativa.id);
        if (!Number.isFinite(dependenteId)) throw new Error('Dependente inválido.');

        const { data: dependente, error: erroDependente } = await supabase
          .from('dependentes')
          .select('id, nome, parentesco, data_nascimento')
          .eq('id', dependenteId)
          .eq('usuario_id', user.id)
          .single();

        if (erroDependente || !dependente) {
          throw new Error('Não foi possível carregar o dependente selecionado.');
        }

        const dadosDependente = dependente as DependenteBanco;
        setPessoaAtiva({ id: dadosDependente.id, nome: dadosDependente.nome, tipo: 'dependente' });
        setUsuario({ nome: dadosDependente.nome, cpf: '' });

        const { data: dadosVacinas, error: erroVacinas } = await supabase
          .from('vacinas')
          .select('id, nome, data_aplicacao, lote, fabricante, proxima_dose, posto, profissional')
          .eq('usuario_id', user.id)
          .eq('dependente_id', dependenteId)
          .eq('status', 'ativo')
          .order('data_aplicacao', { ascending: false });

        if (erroVacinas) throw new Error(`Não foi possível carregar as vacinas: ${erroVacinas.message}`);
        setVacinas((dadosVacinas ?? []) as Vacina[]);
        await obterOuCriarCertificado(user.id, dependenteId);
      } catch (error) {
        console.error('Erro ao gerar certificado:', error);
        setVacinas([]);
        setErro(error instanceof Error ? error.message : 'Não foi possível carregar o certificado.');
      } finally {
        setCarregando(false);
      }
    }

    carregarCertificado();
  }, []);

  function formatarData(data: string | null) {
    if (!data) return 'Não informado';
    const [ano, mes, dia] = data.split('-');
    if (!ano || !mes || !dia) return data;
    return `${dia}/${mes}/${ano}`;
  }


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





  if (erro) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#090d16] px-6">
        <div className="max-w-md text-center">
          <FileText size={32} className="mx-auto text-slate-500" />
          <h2 className="mt-4 text-lg font-semibold text-white">Não foi possível gerar o certificado</h2>
          <p className="mt-2 text-sm text-slate-400">{erro}</p>
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

                  {pessoaAtiva?.tipo === 'dependente' ? 'Identificação do dependente' : 'Identificação do titular'}

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

                            {formatarData(vacina.data_aplicacao)}

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

                    Escaneie para verificar este

                    documento no EasyVacc.

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

                  {urlValidacao ? (
                    <QRCodeSVG
                      value={urlValidacao}
                      size={54}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#0f172a"
                      title="QR Code para validar o certificado EasyVacc"
                    />
                  ) : (
                    <Loader2 size={24} className="animate-spin" />
                  )}

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