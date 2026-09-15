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
        <p className="text-sm font-semibold text-[#00a884]">Versão {PRIVACIDADE_VERSAO}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Política de Privacidade</h1>
        <p className="mt-4 text-slate-300">
          O EasyVacc é uma caderneta digital para organizar o histórico de vacinação da pessoa titular
          e de dependentes. Os dados exibidos na plataforma são cadastrados pelos próprios usuários ou
          por profissionais no painel do posto. Não extraímos automaticamente bases oficiais do Ministério
          da Saúde ou do SI-PNI.
        </p>
        <h2 className="mt-8 text-xl font-bold text-white">Dados que coletamos e para que servem</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>CPF:</strong> identificar a conta de forma única e autenticar o acesso.
          </li>
          <li>
            <strong>CNS (Cartão Nacional de Saúde):</strong> associar a caderneta ao identificador usado
            na rede pública de saúde.
          </li>
          <li>
            <strong>Nome, e-mail, cidade e data de nascimento:</strong> personalizar a caderneta, calcular
            a situação vacinal por idade e enviar comunicações da conta.
          </li>
          <li>
            <strong>Registros de vacina e dependentes:</strong> montar o histórico, alertas de dose e
            certificados digitais.
          </li>
        </ul>
        <h2 className="mt-8 text-xl font-bold text-white">Armazenamento e compartilhamento</h2>
        <p className="mt-3 text-slate-300">
          As informações ficam no servidor da aplicação e não são vendidas. Podem ser acessadas pelo
          titular da conta e, quando aplicável, pelo posto de saúde autorizado a registrar doses.
        </p>
        <h2 className="mt-8 text-xl font-bold text-white">Seus direitos</h2>
        <p className="mt-3 text-slate-300">
          Você pode solicitar atualização ou exclusão dos dados pelo perfil ou pelos canais de contato
          da instituição responsável pela instância do EasyVacc, nos termos da LGPD.
        </p>
        <p className="mt-8 text-sm text-slate-400">
          O aceite desta política é registrado com data e número de versão no momento do cadastro.
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
        <p className="text-sm font-semibold text-[#00a884]">Versão {TERMOS_VERSAO}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Termos de Uso</h1>
        <p className="mt-4 text-slate-300">
          Ao criar uma conta, você declara ter 18 anos ou ser responsável legal por um menor, e
          concorda em informar dados verdadeiros. O EasyVacc destina-se a cidadãos que desejam
          acompanhar a caderneta e a profissionais de saúde no painel do posto.
        </p>
        <h2 className="mt-8 text-xl font-bold text-white">Natureza das informações</h2>
        <p className="mt-3 text-slate-300">
          O sistema não substitui a caderneta oficial em papel nem comprovantes emitidos pelo SUS,
          salvo quando a instituição operadora integrar fontes oficiais. Certificados gerados aqui
          refletem apenas os registros cadastrados nesta plataforma.
        </p>
        <h2 className="mt-8 text-xl font-bold text-white">Responsabilidades</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Manter CPF, senha e e-mail sob sua guarda.</li>
          <li>Não cadastrar vacinas ou dependentes de terceiros sem autorização.</li>
          <li>Entender que a situação vacinal calculada segue regras simplificadas do calendário nacional.</li>
        </ul>
        <p className="mt-8 text-sm text-slate-400">
          O aceite destes termos é registrado com data e número de versão no momento do cadastro.
        </p>
      </article>
    </div>
  );
}
