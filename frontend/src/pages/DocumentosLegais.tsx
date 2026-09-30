import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PRIVACIDADE_VERSAO, TERMOS_VERSAO } from '../lib/brasil';

function CabecalhoLegal() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-800 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00a884]"
        >
          <ArrowLeft size={18} aria-hidden="true" />
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
          O EasyVacc é uma caderneta digital desenvolvida para organizar e
          acompanhar o histórico de vacinação da pessoa titular e de seus
          dependentes. Esta Política de Privacidade explica quais dados são
          tratados pela plataforma, para quais finalidades são utilizados e
          quais medidas são adotadas para protegê-los.
        </p>

        <p className="mt-3 text-slate-300">
          Os registros individuais de vacinação exibidos na caderneta são
          cadastrados no EasyVacc pelo usuário ou por profissionais autorizados
          e não são importados automaticamente da carteira oficial do SUS ou do
          SI-PNI.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Controlador e contato
        </h2>

        <p className="mt-3 text-slate-300">
          Para fins desta Política de Privacidade, a Equipe EasyVacc é
          responsável pela administração da plataforma e pelas decisões
          relacionadas ao tratamento de dados realizado no EasyVacc.
        </p>

        <p className="mt-3 text-slate-300">
          Solicitações relacionadas à privacidade, proteção de dados e ao
          exercício dos direitos previstos na Lei Geral de Proteção de Dados
          Pessoais (LGPD) podem ser encaminhadas para:
        </p>

        <p className="mt-3 font-semibold text-white">
          easyvacc.contato@gmail.com
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Fontes externas de informação
        </h2>

        <p className="mt-3 text-slate-300">
          Algumas informações exibidas pelo EasyVacc são obtidas a partir de
          fontes oficiais. As campanhas de vacinação são sincronizadas a partir
          de informações disponibilizadas pelo Ministério da Saúde, enquanto os
          dados de postos e estabelecimentos de saúde são obtidos a partir do
          Cadastro Nacional de Estabelecimentos de Saúde (CNES).
        </p>

        <p className="mt-3 text-slate-300">
          Essas integrações são utilizadas para disponibilizar informações
          sobre campanhas e unidades de saúde e não representam integração com
          o histórico individual de vacinação do cidadão. O EasyVacc não
          importa automaticamente doses registradas na carteira oficial do SUS
          ou no SI-PNI.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Dados que coletamos e para que servem
        </h2>

        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>CPF:</strong> identificar a conta de forma única e auxiliar
            nos processos de identificação e acesso à plataforma.
          </li>

          <li>
            <strong>CNS (Cartão Nacional de Saúde):</strong> quando informado,
            associar a caderneta ao identificador utilizado na rede pública de
            saúde.
          </li>

          <li>
            <strong>Nome, e-mail, cidade e data de nascimento:</strong>{' '}
            identificar o usuário, personalizar a caderneta, permitir o
            funcionamento da conta e realizar comunicações relacionadas ao
            serviço.
          </li>

          <li>
            <strong>Telefone, endereço e informações de contato:</strong>{' '}
            complementar os dados fornecidos voluntariamente pelo usuário para
            utilização dos recursos disponíveis na plataforma.
          </li>

          <li>
            <strong>Registros de vacinação:</strong> organizar o histórico de
            imunizações, incluindo informações como imunizante, datas, lotes,
            fabricantes, postos e demais informações registradas na plataforma.
          </li>

          <li>
            <strong>Dados de saúde:</strong> quando informados pelo usuário,
            como tipo sanguíneo e alergias, auxiliar na organização das
            informações pessoais mantidas no perfil.
          </li>

          <li>
            <strong>Dados de dependentes:</strong> permitir que o responsável
            organize cadernetas separadas para pessoas sob sua responsabilidade.
          </li>

          <li>
            <strong>Dados técnicos e de segurança:</strong> informações
            necessárias para autenticação, controle de sessão, segurança,
            auditoria e proteção da plataforma.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-bold text-white">
          Princípio da necessidade
        </h2>

        <p className="mt-3 text-slate-300">
          O EasyVacc busca limitar o tratamento de dados pessoais às
          informações adequadas e necessárias para o funcionamento das
          funcionalidades oferecidas. Informações que não sejam necessárias
          para determinada finalidade não devem ser utilizadas de forma
          incompatível com esta Política.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Dados de saúde e dados pessoais sensíveis
        </h2>

        <p className="mt-3 text-slate-300">
          Informações relacionadas à saúde e à identificação em saúde recebem
          tratamento restrito dentro da plataforma. O acesso é limitado ao
          titular da conta, aos responsáveis pelos dependentes e aos
          profissionais autorizados, quando necessário para a prestação das
          funcionalidades disponibilizadas pelo EasyVacc.
        </p>

        <p className="mt-3 text-slate-300">
          CPF, CNS e outros identificadores pessoais não devem ser exibidos
          integralmente sem necessidade. O EasyVacc utiliza mecanismos de
          mascaramento e controle de acesso para reduzir a exposição dessas
          informações.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Bases para o tratamento dos dados
        </h2>

        <p className="mt-3 text-slate-300">
          O tratamento de dados pessoais pelo EasyVacc é realizado de acordo
          com as finalidades informadas nesta Política e com as hipóteses
          aplicáveis previstas na LGPD.
        </p>

        <p className="mt-3 text-slate-300">
          Conforme a natureza da operação, o tratamento poderá ocorrer para
          permitir a execução das funcionalidades solicitadas pelo usuário,
          cumprir obrigações legais ou regulatórias aplicáveis, exercer
          regularmente direitos, prevenir fraudes e proteger a segurança do
          titular e da plataforma.
        </p>

        <p className="mt-3 text-slate-300">
          Dados pessoais sensíveis, especialmente informações relacionadas à
          saúde, recebem proteção reforçada e somente são tratados quando
          necessários às finalidades da plataforma e de acordo com as hipóteses
          legalmente aplicáveis.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Dependentes e menores de idade
        </h2>

        <p className="mt-3 text-slate-300">
          O cadastro de dependentes deve ser realizado somente por pessoa que
          possua responsabilidade ou autorização para administrar essas
          informações.
        </p>

        <p className="mt-3 text-slate-300">
          Quando o dependente for criança ou adolescente, seus dados devem ser
          tratados considerando sua proteção e seu melhor interesse. O
          responsável pela conta deve fornecer apenas informações necessárias
          para a utilização das funcionalidades do EasyVacc.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Armazenamento e serviços utilizados
        </h2>

        <p className="mt-3 text-slate-300">
          O EasyVacc utiliza o Supabase para serviços relacionados ao banco de
          dados, autenticação e armazenamento de arquivos necessários ao
          funcionamento da plataforma. O acesso aos dados é controlado de
          acordo com o perfil do usuário e com as permissões configuradas no
          sistema.
        </p>

        <p className="mt-3 text-slate-300">
          A interface web do EasyVacc pode ser disponibilizada por serviços de
          hospedagem e distribuição da aplicação utilizados pelo projeto. Esses
          serviços podem processar dados técnicos necessários para entregar a
          aplicação e manter seu funcionamento.
        </p>

        <p className="mt-3 text-slate-300">
          As informações pessoais cadastradas no EasyVacc não são vendidas.
          Eventuais prestadores de infraestrutura devem receber apenas os dados
          necessários para a prestação de seus respectivos serviços.
        </p>

        <p className="mt-3 text-slate-300">
          Informações provenientes do Ministério da Saúde e do CNES são
          utilizadas como fontes externas para apresentar campanhas e
          estabelecimentos de saúde. Essas fontes não fornecem ao EasyVacc o
          histórico individual de vacinação dos usuários.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Segurança das informações
        </h2>

        <p className="mt-3 text-slate-300">
          O EasyVacc utiliza mecanismos de autenticação, controle de acesso,
          restrições de banco de dados, registro de alterações e outras medidas
          técnicas destinadas a reduzir o risco de acesso, alteração ou
          divulgação não autorizada de informações.
        </p>

        <p className="mt-3 text-slate-300">
          Nenhum sistema conectado à internet pode garantir segurança absoluta.
          Por isso, as medidas de proteção devem ser revisadas e atualizadas de
          acordo com a evolução da plataforma e dos riscos identificados.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Retenção dos dados
        </h2>

        <p className="mt-3 text-slate-300">
          Os dados pessoais são mantidos enquanto forem necessários para o
          funcionamento da conta e para as finalidades descritas nesta
          Política. Após o encerramento da conta ou o término da finalidade,
          os dados que não precisem mais ser mantidos deverão ser eliminados ou
          anonimizados quando aplicável.
        </p>

        <p className="mt-3 text-slate-300">
          Determinadas informações poderão ser conservadas pelo período
          necessário quando sua manutenção for permitida ou exigida pela
          legislação, para cumprimento de obrigações legais ou regulatórias,
          exercício regular de direitos, segurança, prevenção a fraudes ou
          preservação da integridade de registros e auditorias.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Encerramento da conta e exclusão de dados
        </h2>

        <p className="mt-3 text-slate-300">
          O titular pode solicitar o encerramento da conta e a exclusão dos
          dados pessoais por meio dos recursos disponibilizados no perfil ou
          pelo canal de contato do EasyVacc.
        </p>

        <p className="mt-3 text-slate-300">
          A solicitação será analisada considerando as informações vinculadas à
          conta. Dados que possam ser eliminados serão excluídos ou anonimizados
          quando aplicável. Informações cuja conservação seja necessária ou
          permitida por obrigação legal, segurança, prevenção a fraudes,
          exercício regular de direitos ou preservação de registros de
          auditoria poderão ser mantidas pelo período necessário.
        </p>

        <p className="mt-3 text-slate-300">
          Dependentes vinculados à conta serão considerados no processo de
          encerramento. Registros de vacinação e certificados não devem ser
          eliminados automaticamente sem a análise das regras de retenção e da
          necessidade de preservação da integridade e rastreabilidade dos
          registros.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Backup, restauração e incidentes
        </h2>

        <p className="mt-3 text-slate-300">
          A Equipe EasyVacc deve manter procedimentos compatíveis com a
          infraestrutura utilizada para proteção, recuperação e restauração de
          informações quando necessário.
        </p>

        <p className="mt-3 text-slate-300">
          Em caso de incidente de segurança envolvendo dados pessoais, a
          situação deverá ser analisada, registrada e tratada pela Equipe
          EasyVacc. Quando aplicável, serão adotadas as medidas de comunicação
          e resposta previstas na legislação e nas orientações da autoridade
          competente.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Seus direitos
        </h2>

        <p className="mt-3 text-slate-300">
          Nos termos da LGPD, o titular pode exercer os direitos aplicáveis ao
          tratamento de seus dados pessoais, incluindo solicitar confirmação
          da existência de tratamento, acesso, correção e outras providências
          previstas na legislação.
        </p>

        <p className="mt-3 text-slate-300">
          O EasyVacc também disponibiliza recursos para obtenção de uma cópia
          dos dados da conta em formatos destinados à visualização e ao
          processamento eletrônico.
        </p>

        <p className="mt-3 text-slate-300">
          Solicitações podem ser realizadas pelos recursos disponíveis no
          perfil ou pelo e-mail{' '}
          <strong className="text-white">easyvacc.contato@gmail.com</strong>.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Atualizações desta política
        </h2>

        <p className="mt-3 text-slate-300">
          Esta Política de Privacidade poderá ser atualizada quando houver
          alterações relevantes no funcionamento da plataforma, no tratamento
          dos dados, nas integrações utilizadas ou nas medidas de proteção do
          EasyVacc.
        </p>

        <p className="mt-8 text-sm text-slate-400">
          O aceite desta Política de Privacidade é registrado com data, hora,
          usuário e número de versão no momento do cadastro.
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
          Ao criar uma conta, você declara possuir capacidade para utilizar a
          plataforma e concorda em fornecer informações verdadeiras. O cadastro
          e o gerenciamento de informações de menores ou de outras pessoas
          dependem de responsabilidade ou autorização adequada para esse fim.
        </p>

        <p className="mt-3 text-slate-300">
          O EasyVacc destina-se a cidadãos que desejam organizar e acompanhar
          sua caderneta digital e a profissionais autorizados que utilizam o
          painel profissional.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Responsável pela plataforma
        </h2>

        <p className="mt-3 text-slate-300">
          O EasyVacc é administrado pela Equipe EasyVacc. Dúvidas, solicitações
          relacionadas à conta, privacidade ou proteção de dados podem ser
          encaminhadas para{' '}
          <strong className="text-white">easyvacc.contato@gmail.com</strong>.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Natureza das informações
        </h2>

        <p className="mt-3 text-slate-300">
          O EasyVacc é uma plataforma independente para organização e
          acompanhamento de registros de vacinação. A caderneta e os
          certificados gerados pela plataforma não substituem a caderneta
          oficial, comprovantes ou certificados emitidos pelo SUS ou por outras
          autoridades de saúde.
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
          algumas funcionalidades da plataforma. As campanhas de vacinação são
          sincronizadas a partir de informações disponibilizadas pelo
          Ministério da Saúde, e os dados de postos e estabelecimentos de saúde
          são obtidos a partir do Cadastro Nacional de Estabelecimentos de
          Saúde (CNES).
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
          baseados exclusivamente nos registros existentes na plataforma. Eles
          possuem identificação e mecanismo próprio de validação, mas não
          constituem certificado oficial emitido pelo Ministério da Saúde,
          pelo SUS ou por outra autoridade pública.
        </p>

        <p className="mt-3 text-slate-300">
          A emissão de um certificado depende da existência de registro de
          vacinação válido na plataforma. A validação do documento informa sua
          situação dentro do EasyVacc, como válido, revogado ou substituído,
          quando aplicável.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Uso do painel profissional
        </h2>

        <p className="mt-3 text-slate-300">
          O acesso ao painel profissional é restrito a contas autorizadas para
          essa finalidade. As operações realizadas por profissionais podem ser
          registradas para fins de segurança, rastreabilidade e auditoria.
        </p>

        <p className="mt-3 text-slate-300">
          O profissional deve utilizar os dados acessíveis pela plataforma
          somente para as finalidades autorizadas e relacionadas ao
          funcionamento do EasyVacc.
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
            Não tentar acessar contas, dados, funcionalidades ou áreas da
            plataforma para as quais não possua autorização.
          </li>

          <li>
            Verificar documentos oficiais quando uma comprovação oficial de
            vacinação for exigida.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-bold text-white">
          Privacidade e proteção de dados
        </h2>

        <p className="mt-3 text-slate-300">
          O tratamento de dados pessoais relacionado ao uso da plataforma é
          descrito na Política de Privacidade do EasyVacc, que complementa
          estes Termos de Uso.
        </p>

        <p className="mt-3 text-slate-300">
          O usuário pode utilizar os recursos disponíveis no perfil e o canal
          de contato do EasyVacc para realizar solicitações relacionadas aos
          seus dados pessoais.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Encerramento da conta
        </h2>

        <p className="mt-3 text-slate-300">
          O usuário pode solicitar o encerramento de sua conta. A exclusão,
          anonimização ou conservação das informações vinculadas à conta será
          realizada de acordo com as regras descritas na Política de
          Privacidade e com as hipóteses de conservação aplicáveis.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Disponibilidade e evolução do serviço
        </h2>

        <p className="mt-3 text-slate-300">
          Funcionalidades do EasyVacc podem ser alteradas, corrigidas,
          substituídas ou temporariamente indisponibilizadas em razão de
          manutenção, segurança, evolução técnica ou alterações nos serviços e
          fontes externas utilizados pela plataforma.
        </p>

        <h2 className="mt-8 text-xl font-bold text-white">
          Atualizações dos termos
        </h2>

        <p className="mt-3 text-slate-300">
          Estes Termos de Uso poderão ser atualizados quando houver alterações
          relevantes nas funcionalidades, integrações, medidas de segurança ou
          regras de utilização do EasyVacc.
        </p>

        <p className="mt-8 text-sm text-slate-400">
          O aceite destes Termos de Uso é registrado com data, hora, usuário e
          número de versão no momento do cadastro.
        </p>
      </article>
    </div>
  );
}