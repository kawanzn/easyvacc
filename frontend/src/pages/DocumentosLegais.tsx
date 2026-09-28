import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PRIVACIDADE_VERSAO, TERMOS_VERSAO } from '../lib/brasil';

function CabecalhoLegal() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-800 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
        <Link to="/" className="text-base font-bold text-white">
          Easy<span className="text-[#00a884]">Vacc</span>
        </Link>
      </div>
    </header>
  );
}

export function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <CabecalhoLegal />
      <article className="mx-auto max-w-3xl px-4 py-10 text-base leading-7">
        <p className="text-sm font-semibold text-[#00a884]">
          Versão {PRIVACIDADE_VERSAO}
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white">
          Política de Privacidade
        </h1>

        <p className="mt-4 text-slate-300">
          O EasyVacc é uma caderneta digital para organizar o histórico de
          vacinação da pessoa titular e de seus dependentes. Os registros
          individuais de vacinação exibidos na caderneta são cadastrados no
          EasyVacc pelo usuário ou por profissionais autorizados e não são
          importados automaticamente da carteira oficial do SUS ou do SI-PNI.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Fontes externas de informação
        </h2>

        <p className="mt-3 text-slate-300">
          Algumas informações informativas exibidas pelo EasyVacc são obtidas
          a partir de fontes oficiais. As campanhas de vacinação são
          sincronizadas a partir de informações disponibilizadas pelo
          Ministério da Saúde, enquanto os dados de postos e estabelecimentos
          de saúde são obtidos a partir do Cadastro Nacional de
          Estabelecimentos de Saúde (CNES).
        </p>

        <p className="mt-3 text-slate-300">
          Essas integrações são utilizadas para disponibilizar informações
          sobre campanhas e unidades de saúde e não representam integração
          com o histórico individual de vacinação do cidadão. O EasyVacc não
          importa automaticamente doses registradas na carteira oficial do
          SUS ou no SI-PNI.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Dados que coletamos e para que servem
        </h2>

        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>CPF:</strong> identificar a conta de forma única e
            autenticar o acesso.
          </li>

          <li>
            <strong>CNS (Cartão Nacional de Saúde):</strong> associar a
            caderneta ao identificador utilizado na rede pública de saúde.
          </li>

          <li>
            <strong>Nome, e-mail, cidade e data de nascimento:</strong>{' '}
            identificar o usuário, personalizar a caderneta e permitir
            comunicações relacionadas à conta.
          </li>

          <li>
            <strong>Registros de vacinação:</strong> organizar o histórico de
            doses, datas, lotes, fabricantes, postos e demais informações
            registradas na plataforma.
          </li>

          <li>
            <strong>Dados de dependentes:</strong> permitir que o responsável
            organize cadernetas separadas para pessoas sob sua
            responsabilidade.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-bold text-white">
          Dados de saúde
        </h2>

        <p className="mt-3 text-slate-300">
          Informações relacionadas à vacinação e à identificação em saúde
          recebem tratamento restrito dentro da plataforma. O acesso é
          limitado ao titular da conta, aos responsáveis pelos dependentes e,
          quando necessário para o funcionamento do serviço, a profissionais
          autorizados.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Armazenamento e compartilhamento
        </h2>

        <p className="mt-3 text-slate-300">
          As informações são armazenadas na infraestrutura utilizada pelo
          EasyVacc e não são vendidas. O acesso aos dados é controlado de
          acordo com o perfil do usuário e com as permissões necessárias para
          o funcionamento da plataforma.
        </p>

        <p className="mt-3 text-slate-300">
          Informações provenientes do Ministério da Saúde e do CNES são
          utilizadas como fontes externas para apresentar campanhas e
          estabelecimentos de saúde. Essas fontes não fornecem ao EasyVacc o
          histórico individual de vacinação dos usuários.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Seus direitos
        </h2>

        <p className="mt-3 text-slate-300">
          Nos termos da Lei Geral de Proteção de Dados Pessoais (LGPD), você
          pode solicitar acesso, correção, atualização e, quando aplicável,
          exclusão de seus dados pessoais pelos recursos disponíveis no
          perfil ou pelos canais de contato da instituição responsável pelo
          EasyVacc.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Atualizações desta política
        </h2>

        <p className="mt-3 text-slate-300">
          Esta Política de Privacidade poderá ser atualizada quando houver
          alterações relevantes no funcionamento da plataforma, no tratamento
          dos dados ou nas integrações utilizadas pelo EasyVacc.
        </p>

        <p className="mt-8 text-sm text-slate-400">
          O aceite desta política é registrado com data e número de versão no
          momento do cadastro.
        </p>
      </article>
    </div>
  );
}

export function TermosUso() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <CabecalhoLegal />

      <article className="mx-auto max-w-3xl px-4 py-10 text-base leading-7">
        <p className="text-sm font-semibold text-[#00a884]">
          Versão {TERMOS_VERSAO}
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white">
          Termos de Uso
        </h1>

        <p className="mt-4 text-slate-300">
          Ao criar uma conta, você declara ter 18 anos ou ser responsável
          legal por um menor e concorda em fornecer informações verdadeiras.
          O EasyVacc destina-se a cidadãos que desejam organizar e acompanhar
          sua caderneta digital e a profissionais autorizados que utilizam o
          painel profissional.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Natureza das informações
        </h2>

        <p className="mt-3 text-slate-300">
          O EasyVacc é uma plataforma independente para organização e
          acompanhamento de registros de vacinação. A caderneta e os
          certificados gerados pela plataforma não substituem a caderneta
          oficial, comprovantes ou certificados emitidos pelo SUS ou por
          outras autoridades de saúde.
        </p>

        <p className="mt-3 text-slate-300">
          Os registros individuais de vacinação apresentados na caderneta
          refletem somente as informações cadastradas no EasyVacc pelo usuário
          ou por profissionais autorizados. O sistema não importa
          automaticamente o histórico individual de vacinação da carteira
          oficial do SUS ou do SI-PNI.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Informações provenientes de fontes oficiais
        </h2>

        <p className="mt-3 text-slate-300">
          O EasyVacc utiliza informações de fontes oficiais para complementar
          algumas funcionalidades da plataforma. As campanhas de vacinação
          são sincronizadas a partir de informações disponibilizadas pelo
          Ministério da Saúde, e os dados de postos e estabelecimentos de
          saúde são obtidos a partir do Cadastro Nacional de Estabelecimentos
          de Saúde (CNES).
        </p>

        <p className="mt-3 text-slate-300">
          A utilização dessas fontes não significa que o EasyVacc tenha acesso
          ao histórico individual de vacinação mantido pelo SUS. Campanhas,
          estabelecimentos de saúde e registros pessoais de vacinação são
          informações distintas dentro da plataforma.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Certificados EasyVacc
        </h2>

        <p className="mt-3 text-slate-300">
          Os certificados gerados pelo EasyVacc são documentos digitais
          baseados exclusivamente nos registros existentes na plataforma.
          Eles possuem identificação e mecanismo próprio de validação, mas não
          constituem certificado oficial emitido pelo Ministério da Saúde,
          pelo SUS ou por outra autoridade pública.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Responsabilidades
        </h2>

        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            Manter suas credenciais de acesso protegidas e não compartilhá-las
            com terceiros.
          </li>

          <li>
            Fornecer informações verdadeiras e manter os dados da conta
            atualizados.
          </li>

          <li>
            Não cadastrar dependentes sem possuir responsabilidade ou
            autorização para gerenciar seus dados.
          </li>

          <li>
            Não inserir, alterar ou utilizar registros de vacinação de forma
            falsa, indevida ou enganosa.
          </li>

          <li>
            Verificar documentos oficiais quando uma comprovação oficial de
            vacinação for exigida.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-bold text-white">
          Atualizações dos termos
        </h2>

        <p className="mt-3 text-slate-300">
          Estes Termos de Uso poderão ser atualizados quando houver alterações
          relevantes nas funcionalidades, integrações ou regras de utilização
          do EasyVacc.
        </p>

        <p className="mt-8 text-sm text-slate-400">
          O aceite destes termos é registrado com data e número de versão no
          momento do cadastro.
        </p>
      </article>
    </div>
  );
}