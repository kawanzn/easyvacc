import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import {
  PRIVACIDADE_VERSAO,
  TERMOS_VERSAO,
  cnsValido,
  cpfValido,
  mascaraCns,
  mascaraCpf,
  senhaAtendeRequisitos,
  soDigitos,
} from '../lib/brasil';

function mensagemErroCadastro(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Não foi possível concluir o cadastro. Tente novamente.';
  }

  const erro = error as {
    message?: string;
    code?: string;
    status?: number;
  };

  const mensagem = (erro.message ?? '').toLowerCase();
  const codigo = (erro.code ?? '').toLowerCase();

  if (
    mensagem.includes('email rate limit exceeded') ||
    mensagem.includes('rate limit') ||
    mensagem.includes('too many requests') ||
    erro.status === 429
  ) {
    return 'Muitas solicitações foram realizadas. Aguarde alguns minutos e tente novamente.';
  }

  if (
    mensagem.includes('already registered') ||
    mensagem.includes('already been registered') ||
    mensagem.includes('user already registered') ||
    mensagem.includes('email already') ||
    mensagem.includes('already exists')
  ) {
    return 'Já existe uma conta cadastrada com este e-mail.';
  }

  if (
    mensagem.includes('invalid email') ||
    mensagem.includes('email address is invalid')
  ) {
    return 'Informe um e-mail válido.';
  }

  if (
    mensagem.includes('password') &&
    (
      mensagem.includes('characters') ||
      mensagem.includes('length') ||
      mensagem.includes('weak') ||
      mensagem.includes('short')
    )
  ) {
    return 'A senha informada não atende aos requisitos de segurança.';
  }

  if (
    mensagem.includes('signup is disabled') ||
    mensagem.includes('signups not allowed')
  ) {
    return 'Novos cadastros estão temporariamente indisponíveis.';
  }

  if (
    mensagem.includes('network') ||
    mensagem.includes('failed to fetch') ||
    mensagem.includes('fetch failed')
  ) {
    return 'Não foi possível conectar ao serviço. Verifique sua internet e tente novamente.';
  }

  if (
    codigo === '23505' ||
    codigo === 'unique_violation'
  ) {
    return 'CPF, CNS ou e-mail já cadastrado.';
  }

  if (
    mensagem.includes('duplicate key') ||
    mensagem.includes('unique constraint')
  ) {
    return 'CPF, CNS ou e-mail já cadastrado.';
  }

  return 'Não foi possível concluir o cadastro. Tente novamente.';
}

export default function Cadastro() {
  const [temaClaro, setTemaClaro] = useState(() => {
    return localStorage.getItem('easyvacc-tema') === 'claro';
  });

  useEffect(() => {
    const sincronizarTema = () => setTemaClaro(localStorage.getItem('easyvacc-tema') === 'claro');
    window.addEventListener('storage', sincronizarTema);
    window.addEventListener('easyvacc-tema-atualizado', sincronizarTema);
    window.addEventListener('easyvaccTemaAtualizado', sincronizarTema);
    return () => {
      window.removeEventListener('storage', sincronizarTema);
      window.removeEventListener('easyvacc-tema-atualizado', sincronizarTema);
      window.removeEventListener('easyvaccTemaAtualizado', sincronizarTema);
    };
  }, []);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cns, setCns] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirmacao, setEmailConfirmacao] = useState('');
  const [cidade, setCidade] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceitePrivacidade, setAceitePrivacidade] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Informe seu nome completo.');
      return;
    }

    if (!cpfValido(cpf)) {
      setErro('O CPF informado é inválido. Confira os números e tente novamente.');
      return;
    }

    if (cns.trim() && !cnsValido(cns)) {
      setErro(
        'O Cartão Nacional de Saúde (CNS) informado é inválido. Confira os 15 dígitos ou deixe o campo em branco.'
      );
      return;
    }

    if (!email.trim()) {
      setErro('Informe seu e-mail.');
      return;
    }

    if (
      email.trim().toLowerCase() !==
      emailConfirmacao.trim().toLowerCase()
    ) {
      setErro('Os e-mails digitados não coincidem.');
      return;
    }

    if (!cidade.trim()) {
      setErro('Informe sua cidade.');
      return;
    }

    if (dataNascimento) {
      const nascimento = new Date(`${dataNascimento}T00:00:00`);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (Number.isNaN(nascimento.getTime())) {
        setErro('A data de nascimento informada é inválida.');
        return;
      }

      if (nascimento > hoje) {
        setErro('A data de nascimento não pode ser uma data futura.');
        return;
      }
    }

    if (senha !== senhaConfirmacao) {
      setErro('As senhas precisam ser idênticas.');
      return;
    }

    if (!senhaAtendeRequisitos(senha)) {
      setErro(
        'A senha deve ter no mínimo 8 caracteres, com letras e números.'
      );
      return;
    }

    if (!aceiteTermos || !aceitePrivacidade) {
      setErro(
        'Aceite os termos de uso e a política de privacidade para continuar.'
      );
      return;
    }

    setCarregando(true);

    try {
      const emailNormalizado = email.trim().toLowerCase();
      const cpfNormalizado = soDigitos(cpf);
      const cnsNormalizado = soDigitos(cns);

      const { data, error: functionError } =
        await supabase.functions.invoke('cadastro-cidadao', {
          body: {
            nome: nome.trim(),
            cpf: cpfNormalizado,
            cns: cnsNormalizado || null,
            email: emailNormalizado,
            cidade: cidade.trim(),
            data_nascimento: dataNascimento || null,
            senha,
            termos_versao: TERMOS_VERSAO,
            privacidade_versao: PRIVACIDADE_VERSAO,
          },
        });

      if (functionError) {
        console.error(
          'Erro ao chamar cadastro-cidadao:',
          functionError
        );

        const contexto =
          (functionError as {
            context?: Response;
          }).context;

        if (contexto) {
          try {
            const resposta = await contexto.clone().json();

            if (resposta?.mensagem) {
              setErro(String(resposta.mensagem));
              return;
            }
          } catch (erroResposta) {
            console.error(
              'Não foi possível ler a resposta da função:',
              erroResposta
            );
          }
        }

        setErro(mensagemErroCadastro(functionError));
        return;
      }

      if (!data?.sucesso) {
        setErro(
          data?.mensagem ||
            'Não foi possível concluir o cadastro. Tente novamente.'
        );
        return;
      }

      navigate('/confirmar-email', {
        state: {
          email: emailNormalizado,
          mensagem:
            data.mensagem ||
            'Cadastro realizado. Verifique seu e-mail para confirmar sua conta.',
        },
      });
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setErro(mensagemErroCadastro(error));
    } finally {
      setCarregando(false);
    }
  };

  // A validação permanece a mesma; apenas posicionamos a mensagem ao lado do campo.
  const campoComErro = !erro ? ''
    : /nome completo/i.test(erro) ? 'nome'
    : /\bCPF\b/i.test(erro) && !/CNS|ou e-mail/i.test(erro) ? 'cpf'
    : /\bCNS\b|Cartão Nacional de Saúde/i.test(erro) && !/CPF, CNS ou/i.test(erro) ? 'cns'
    : /e-mails.*não coincidem/i.test(erro) ? 'emailConfirmacao'
    : /e-mail/i.test(erro) && !/CPF, CNS ou/i.test(erro) ? 'email'
    : /sua cidade/i.test(erro) ? 'cidade'
    : /data de nascimento/i.test(erro) ? 'dataNascimento'
    : /senhas.*idênticas/i.test(erro) ? 'senhaConfirmacao'
    : /a senha|senha informada/i.test(erro) ? 'senha'
    : '';
  const erroDeCampo = (campo: string) => campoComErro === campo ? erro : '';

  const campo =
    'w-full rounded-lg border border-[#405775] bg-[#020817] px-4 py-3.5 text-base text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className={`ev-ui easyvacc-cadastro relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] p-4 font-sans text-slate-100 ${temaClaro ? 'easyvacc-cadastro-light' : ''}`}>
      <style>{`
        .easyvacc-cadastro-light {
          background: #f8fafc !important;
          color: #0f172a !important;
        }
        .easyvacc-cadastro-light .text-white,
        .easyvacc-cadastro-light .text-slate-100 {
          color: #0f172a !important;
        }
        .easyvacc-cadastro-light .text-slate-200,
        .easyvacc-cadastro-light .text-slate-300 {
          color: #334155 !important;
        }
        .easyvacc-cadastro-light .text-slate-400 {
          color: #475569 !important;
        }
        .easyvacc-cadastro-light .text-slate-500 {
          color: #64748b !important;
        }
        .easyvacc-cadastro-light [class~="bg-[#081629]"],
        .easyvacc-cadastro-light [class~="bg-[#081629]/80"],
        .easyvacc-cadastro-light [class~="bg-[#081629]/90"] {
          background-color: #ffffff !important;
        }
        .easyvacc-cadastro-light [class~="bg-[#020817]"],
        .easyvacc-cadastro-light [class~="bg-[#020817]/80"] {
          background-color: #ffffff !important;
        }
        .easyvacc-cadastro-light [class~="border-[#304760]"],
        .easyvacc-cadastro-light [class~="border-[#405775]"] {
          border-color: #cbd5e1 !important;
        }
        .easyvacc-cadastro-light input,
        .easyvacc-cadastro-light select,
        .easyvacc-cadastro-light textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        .easyvacc-cadastro-light input::placeholder,
        .easyvacc-cadastro-light textarea::placeholder {
          color: #64748b !important;
        }
        .easyvacc-cadastro-light [class~="hover:text-white"]:hover {
          color: #0f172a !important;
        }
        .easyvacc-cadastro-light [class~="hover:bg-slate-800"]:hover,
        .easyvacc-cadastro-light [class~="hover:bg-[#081629]"]:hover {
          background-color: #f1f5f9 !important;
        }
        .easyvacc-cadastro-light { background: #f5f8fc !important; color: #102b49 !important; }
        .easyvacc-cadastro-light [class~="bg-[#081629]"],
        .easyvacc-cadastro-light [class~="bg-[#081629]/80"],
        .easyvacc-cadastro-light [class~="bg-[#081629]/90"],
        .easyvacc-cadastro-light [class~="bg-[#081629]/70"],
        .easyvacc-cadastro-light [class~="bg-[#081629]/60"],
        .easyvacc-cadastro-light [class~="bg-[#081629]/50"],
        .easyvacc-cadastro-light [class~="bg-[#020817]"],
        .easyvacc-cadastro-light [class~="bg-[#020817]/50"],
        .easyvacc-cadastro-light [class~="bg-[#020817]/60"],
        .easyvacc-cadastro-light [class~="bg-[#020817]/80"] { background-color: #fff !important; }
        .easyvacc-cadastro-light [class~="border-[#304760]"],
        .easyvacc-cadastro-light [class~="border-[#304760]/80"],
        .easyvacc-cadastro-light [class~="border-[#405775]"] { border-color: #cbd5e1 !important; }
        .easyvacc-cadastro-light .text-white,
        .easyvacc-cadastro-light .text-slate-100 { color: #102b49 !important; }
        .easyvacc-cadastro-light .text-slate-200,
        .easyvacc-cadastro-light .text-slate-300 { color: #334155 !important; }
        .easyvacc-cadastro-light [class~="text-[#1478b8]"] { color: #126ca8 !important; }
        .easyvacc-cadastro-light input:not([type="checkbox"]),
        .easyvacc-cadastro-light select,
        .easyvacc-cadastro-light textarea { background: #fff !important; color: #102b49 !important; border-color: #cbd5e1 !important; }
        .easyvacc-cadastro-light button[type="submit"] { color: #fff !important; }
        /* Cadastro: layout exclusivo para celulares. Desktop preservado. */
        @media screen and (max-width: 767px) {
          .easyvacc-cadastro {
            display: block !important;
            position: relative;
            box-sizing: border-box;
            width: 100%;
            min-height: 100svh;
            height: auto !important;
            overflow-x: clip !important;
            overflow-y: visible !important;
            padding: 0 0 calc(24px + env(safe-area-inset-bottom, 0px)) !important;
            background: #071c31 !important;
          }
          .easyvacc-cadastro.easyvacc-cadastro-light {
            background: #f0f6fc !important;
          }
          .easyvacc-cadastro::before {
            content: '';
            position: absolute;
            z-index: 0;
            inset: 0 0 auto;
            height: 265px;
            pointer-events: none;
            background: linear-gradient(145deg, #0b4e85 0%, #126da9 55%, #1987c4 100%);
            border-radius: 0 0 30px 30px;
          }
          .easyvacc-cadastro .ev-cadastro-back {
            position: relative !important;
            z-index: 2;
            top: auto !important;
            left: auto !important;
            display: inline-flex;
            height: 42px;
            margin: calc(16px + env(safe-area-inset-top, 0px)) 18px 0;
            padding: 0 14px;
            border: 1px solid rgba(255,255,255,.30) !important;
            border-radius: 999px;
            background: rgba(255,255,255,.13) !important;
            color: #fff !important;
            font-size: 13px !important;
            font-weight: 700;
            text-decoration: none;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
          .easyvacc-cadastro .ev-cadastro-back:focus-visible,
          .easyvacc-cadastro .ev-cadastro-form :is(input, button, a):focus-visible {
            outline: 3px solid #70c9ff;
            outline-offset: 2px;
          }
          .easyvacc-cadastro .ev-cadastro-mobile-intro {
            position: relative;
            z-index: 1;
            display: block;
            margin: 21px 22px 20px;
            color: #fff;
          }
          .easyvacc-cadastro .ev-cadastro-mobile-brand {
            margin: 0;
            color: #fff;
            font-size: 21px;
            font-weight: 850;
            line-height: 1.2;
            letter-spacing: -.05em;
          }
          .easyvacc-cadastro .ev-cadastro-mobile-brand span { color: #c9eaff; }
          .easyvacc-cadastro .ev-cadastro-mobile-caption {
            margin: 5px 0 0;
            color: #dcefff;
            font-size: 13px;
            line-height: 1.5;
          }
          .easyvacc-cadastro .ev-cadastro-card {
            position: relative;
            z-index: 1;
            box-sizing: border-box;
            width: calc(100% - 24px) !important;
            max-width: 560px !important;
            min-width: 0;
            margin: 0 auto !important;
            padding: 25px 19px 28px !important;
            border: 1px solid #dce7f2 !important;
            border-radius: 25px !important;
            background: #fff !important;
            box-shadow: 0 14px 38px rgba(12, 55, 96, .13) !important;
            color: #18324d !important;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-card {
            border-color: #31516d !important;
            background: #102941 !important;
            color: #edf7ff !important;
          }
          .easyvacc-cadastro .ev-cadastro-heading {
            margin-bottom: 25px !important;
            text-align: left !important;
          }
          .easyvacc-cadastro .ev-cadastro-heading h2 {
            margin: 0;
            color: #173c5e !important;
            font-size: clamp(24px, 6.4vw, 28px) !important;
            font-weight: 850;
            line-height: 1.16;
            letter-spacing: -.045em;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-heading h2 {
            color: #f3f9ff !important;
          }
          .easyvacc-cadastro .ev-cadastro-heading p {
            margin-top: 9px !important;
            color: #60758b !important;
            font-size: 14px !important;
            line-height: 1.5;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-heading p {
            color: #b7cce0 !important;
          }
          .easyvacc-cadastro .ev-cadastro-heading a {
            color: #126da8 !important;
            text-underline-offset: 3px;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-heading a {
            color: #91d5ff !important;
          }
          .easyvacc-cadastro .ev-cadastro-form { min-width: 0; }
          .easyvacc-cadastro .ev-cadastro-form > h3 {
            margin-top: 23px;
            padding: 0 0 10px !important;
            border-bottom: 1px solid #dce7f2 !important;
            color: #155e96 !important;
            font-size: 14px !important;
            font-weight: 800;
            line-height: 1.4;
          }
          .easyvacc-cadastro .ev-cadastro-form > h3:first-child { margin-top: 0; }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-form > h3 {
            border-color: #31516d !important;
            color: #9ed8ff !important;
          }
          .easyvacc-cadastro .ev-cadastro-form label {
            color: #2c4258 !important;
            font-size: 14px !important;
            line-height: 1.4;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-form label {
            color: #d6e7f6 !important;
          }
          .easyvacc-cadastro .ev-cadastro-form :is(input:not([type='checkbox']), select, textarea) {
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
            min-height: 51px !important;
            padding: 12px 14px !important;
            border: 1px solid #cfdeeb !important;
            border-radius: 13px !important;
            background: #f9fbfe !important;
            color: #18324d !important;
            font-size: 16px !important;
            line-height: 1.4;
          }
          .easyvacc-cadastro .ev-cadastro-form :is(input:not([type='checkbox']), textarea)::placeholder {
            color: #778ca0 !important;
            opacity: 1;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-form :is(input:not([type='checkbox']), select, textarea) {
            border-color: #35536f !important;
            background: #0b2035 !important;
            color: #edf7ff !important;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-form :is(input:not([type='checkbox']), textarea)::placeholder {
            color: #9ab2c7 !important;
          }
          .easyvacc-cadastro .ev-cadastro-form input[type='date'] { max-width: 100%; }
          .easyvacc-cadastro .ev-cadastro-form .grid { gap: 18px !important; }
          .easyvacc-cadastro .ev-cadastro-form p.text-xs {
            color: #637b91 !important;
            font-size: 12px !important;
            line-height: 1.55;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-form p.text-xs {
            color: #b1c8dd !important;
          }
          .easyvacc-cadastro .ev-cadastro-form p[role='alert'] {
            color: #b42335 !important;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-form p[role='alert'] {
            color: #ffb4bd !important;
          }
          .easyvacc-cadastro .ev-cadastro-consents {
            padding: 16px !important;
            border: 1px solid #d8e6f2 !important;
            border-radius: 17px !important;
            background: #f2f8fd !important;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-consents {
            border-color: #35536f !important;
            background: #0b2035 !important;
          }
          .easyvacc-cadastro .ev-cadastro-global-error {
            border-color: #f0b8bd !important;
            background: #fff1f2 !important;
            color: #9f2432 !important;
            text-align: left;
            line-height: 1.5;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-global-error {
            border-color: #894550 !important;
            background: #3c1c29 !important;
            color: #ffbec6 !important;
          }
          .easyvacc-cadastro .ev-cadastro-form input[aria-invalid='true'] {
            border-color: #c83b4b !important;
          }
          .easyvacc-cadastro .ev-cadastro-form input[type='checkbox'] {
            flex: 0 0 20px;
            width: 20px;
            height: 20px;
            accent-color: #1478b8;
          }
          .easyvacc-cadastro .ev-cadastro-form input[type='checkbox'] + span {
            min-width: 0;
            font-size: 13px;
            line-height: 1.6;
          }
          .easyvacc-cadastro .ev-cadastro-form button[type='submit'] {
            min-height: 53px !important;
            border-radius: 15px !important;
            background: linear-gradient(110deg, #1378b9, #0c5d98) !important;
            color: #fff !important;
            font-size: 15px !important;
            box-shadow: 0 6px 18px rgba(19, 120, 185, .20);
          }
          .easyvacc-cadastro .ev-cadastro-form button[aria-label='Mostrar senha'],
          .easyvacc-cadastro .ev-cadastro-form button[aria-label='Ocultar senha'] {
            color: #5c7892 !important;
          }
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-form button[aria-label='Mostrar senha'],
          .easyvacc-cadastro:not(.easyvacc-cadastro-light) .ev-cadastro-form button[aria-label='Ocultar senha'] {
            color: #b8d0e3 !important;
          }
          .easyvacc-cadastro .ev-cadastro-form input:focus {
            border-color: #1478b8 !important;
            box-shadow: 0 0 0 3px rgba(20, 120, 184, .14);
          }
          .easyvacc-cadastro .ev-cadastro-form :is(input, button, a) { touch-action: manipulation; }
        }
        @media screen and (max-width: 359px) {
          .easyvacc-cadastro .ev-cadastro-card { padding: 21px 15px 25px !important; }
          .easyvacc-cadastro .ev-cadastro-mobile-intro { margin-left: 18px; }
        }
      `}</style>

     <Link
  to="/login"
  className={`ev-cadastro-back absolute top-6 left-6 z-10 inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold backdrop-blur transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
    temaClaro
      ? "border-slate-300 bg-white/90 text-slate-900 hover:bg-slate-100"
      : "border-white/30 bg-slate-950/25 text-white hover:bg-slate-950/45"
  }`}
>
  <ArrowLeft size={16} aria-hidden="true" />
  Voltar ao login
</Link>

      <div className="ev-cadastro-mobile-intro hidden" aria-hidden="true">
        <p className="ev-cadastro-mobile-brand">Easy<span>Vacc</span></p>
        <p className="ev-cadastro-mobile-caption">Sua caderneta digital começa aqui.</p>
      </div>

      <div className="ev-card ev-cadastro-card my-8 w-full max-w-xl rounded-[2rem] border border-[#304760] bg-[#081629]/90 p-6 shadow-2xl sm:p-8 md:p-10">
        <div className="ev-cadastro-heading mb-8 text-center">
          <h2 className="ev-portal-title text-3xl font-black tracking-tight text-white">
            Criar nova conta
          </h2>

          <p className="mt-2 text-base text-slate-200">
            Ou{' '}
            <Link
              to="/login"
              className="rounded font-bold text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#081629]"
            >
              já tenho uma conta
            </Link>
          </p>
        </div>

        <form
          className="ev-cadastro-form space-y-5"
          onSubmit={handleCadastro}
          noValidate
        >
          <h3 className="border-b border-slate-700 pb-2 text-sm font-bold text-slate-200">Dados pessoais e identificação</h3>
          <div>
            <label
              htmlFor="nome"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              Nome completo *
            </label>

            <input
              id="nome"
              required
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              className={campo}
              placeholder="Seu nome completo"
              autoComplete="name"
            aria-invalid={Boolean(erroDeCampo('nome'))}
              aria-describedby={erroDeCampo('nome') ? 'erro-cadastro-nome' : undefined}
            />
              {erroDeCampo('nome') && <p id="erro-cadastro-nome" role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{erroDeCampo('nome')}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="cpf"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                CPF *
              </label>

              <input
                id="cpf"
                required
                inputMode="numeric"
                value={cpf}
                onChange={(e) =>
                  setCpf(
                    mascaraCpf(
                      e.target.value
                    )
                  )
                }
                className={campo}
                placeholder="000.000.000-00"
                autoComplete="off"
              aria-invalid={Boolean(erroDeCampo('cpf'))}
              aria-describedby={erroDeCampo('cpf') ? 'erro-cadastro-cpf' : undefined}
            />
              {erroDeCampo('cpf') && <p id="erro-cadastro-cpf" role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{erroDeCampo('cpf')}</p>}

              <p className="mt-1 text-xs leading-5 text-slate-300">
                Identifica sua conta e o acesso.
              </p>
            </div>

            <div>
              <label
                htmlFor="cns"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Cartão Nacional de Saúde
              </label>

              <input
                id="cns"
                inputMode="numeric"
                value={cns}
                onChange={(e) =>
                  setCns(
                    mascaraCns(
                      e.target.value
                    )
                  )
                }
                className={campo}
                placeholder="000 0000 0000 0000"
                autoComplete="off"
              aria-invalid={Boolean(erroDeCampo('cns'))}
              aria-describedby={erroDeCampo('cns') ? 'erro-cadastro-cns' : undefined}
            />
              {erroDeCampo('cns') && <p id="erro-cadastro-cns" role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{erroDeCampo('cns')}</p>}

              <p className="mt-1 text-xs leading-5 text-slate-300">
                Opcional. Se informado, deve conter um CNS válido com 15 dígitos.
              </p>
            </div>
          </div>

          <h3 className="border-b border-slate-700 pb-2 pt-2 text-sm font-bold text-slate-200">Contato e localização</h3>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              E-mail *
            </label>

            <input
              id="email"
              required
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className={campo}
              placeholder="seu@email.com"
              autoComplete="email"
            aria-invalid={Boolean(erroDeCampo('email'))}
              aria-describedby={erroDeCampo('email') ? 'erro-cadastro-email' : undefined}
            />
              {erroDeCampo('email') && <p id="erro-cadastro-email" role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{erroDeCampo('email')}</p>}
          </div>

          <div>
            <label
              htmlFor="emailConfirmacao"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              Confirmar e-mail *
            </label>

            <input
              id="emailConfirmacao"
              required
              type="email"
              value={
                emailConfirmacao
              }
              onChange={(e) =>
                setEmailConfirmacao(
                  e.target.value
                )
              }
              className={campo}
              placeholder="Repita o e-mail"
              autoComplete="email"
            aria-invalid={Boolean(erroDeCampo('emailConfirmacao'))}
              aria-describedby={erroDeCampo('emailConfirmacao') ? 'erro-cadastro-emailConfirmacao' : undefined}
            />
              {erroDeCampo('emailConfirmacao') && <p id="erro-cadastro-emailConfirmacao" role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{erroDeCampo('emailConfirmacao')}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="cidade"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Cidade *
              </label>

              <input
                id="cidade"
                required
                value={cidade}
                onChange={(e) =>
                  setCidade(
                    e.target.value
                  )
                }
                className={campo}
                placeholder="Sua cidade"
                autoComplete="address-level2"
              aria-invalid={Boolean(erroDeCampo('cidade'))}
              aria-describedby={erroDeCampo('cidade') ? 'erro-cadastro-cidade' : undefined}
            />
              {erroDeCampo('cidade') && <p id="erro-cadastro-cidade" role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{erroDeCampo('cidade')}</p>}
            </div>

            <div>
              <label
                htmlFor="dataNascimento"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Data de nascimento
              </label>

              <input
                id="dataNascimento"
                type="date"
                value={
                  dataNascimento
                }
                onChange={(e) =>
                  setDataNascimento(
                    e.target.value
                  )
                }
                className={campo}
                autoComplete="bday"
              aria-invalid={Boolean(erroDeCampo('dataNascimento'))}
              aria-describedby={erroDeCampo('dataNascimento') ? 'erro-cadastro-dataNascimento' : undefined}
            />
              {erroDeCampo('dataNascimento') && <p id="erro-cadastro-dataNascimento" role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{erroDeCampo('dataNascimento')}</p>}
            </div>
          </div>

          <h3 className="border-b border-slate-700 pb-2 pt-2 text-sm font-bold text-slate-200">Segurança da conta</h3>
          <div>
            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              Senha *
            </label>

            <div className="relative">
              <input
                id="senha"
                required
                type={
                  mostrarSenha
                    ? 'text'
                    : 'password'
                }
                value={senha}
                onChange={(e) =>
                  setSenha(
                    e.target.value
                  )
                }
                className={`${campo} pr-12`}
                placeholder="Mínimo 8 caracteres, letras e números"
                autoComplete="new-password"
                aria-invalid={Boolean(erroDeCampo('senha'))}
                aria-describedby={erroDeCampo('senha') ? 'senha-requisitos erro-cadastro-senha' : 'senha-requisitos'}
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha(
                    (valor) =>
                      !valor
                  )
                }
                className="absolute inset-y-0 right-0 min-w-11 rounded-r-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
                aria-label={
                  mostrarSenha
                    ? 'Ocultar senha'
                    : 'Mostrar senha'
                }
              >
                {mostrarSenha ? (
                  <EyeOff
                    size={18}
                    className="mx-auto"
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    size={18}
                    className="mx-auto"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
            {erroDeCampo('senha') && <p id="erro-cadastro-senha" role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{erroDeCampo('senha')}</p>}

            <p
              id="senha-requisitos"
              className="mt-2 text-xs leading-5 text-slate-300"
            >
              Use no mínimo 8 caracteres, incluindo letras e números.
            </p>
          </div>

          <div>
            <label
              htmlFor="senhaConfirmacao"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              Confirmar senha *
            </label>

            <input
              id="senhaConfirmacao"
              required
              type={
                mostrarSenha
                  ? 'text'
                  : 'password'
              }
              value={
                senhaConfirmacao
              }
              onChange={(e) =>
                setSenhaConfirmacao(
                  e.target.value
                )
              }
              className={campo}
              placeholder="Repita a senha"
              autoComplete="new-password"
            aria-invalid={Boolean(erroDeCampo('senhaConfirmacao'))}
              aria-describedby={erroDeCampo('senhaConfirmacao') ? 'erro-cadastro-senhaConfirmacao' : undefined}
            />
              {erroDeCampo('senhaConfirmacao') && <p id="erro-cadastro-senhaConfirmacao" role="alert" className="mt-1.5 text-xs font-semibold text-red-300">{erroDeCampo('senhaConfirmacao')}</p>}
          </div>

          <div className="ev-cadastro-consents space-y-3 rounded-xl border border-[#304760] bg-[#020817]/50 p-4 text-sm leading-6 text-slate-200">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                aria-required="true"
                className="mt-1 h-5 w-5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                checked={
                  aceiteTermos
                }
                onChange={(e) =>
                  setAceiteTermos(
                    e.target.checked
                  )
                }
              />

              <span>
                Li e aceito os{' '}
                <Link
                  to="/termos"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded font-bold text-[#1478b8] underline focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Termos de uso
                </Link>{' '}
                
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                aria-required="true"
                className="mt-1 h-5 w-5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                checked={
                  aceitePrivacidade
                }
                onChange={(e) =>
                  setAceitePrivacidade(
                    e.target.checked
                  )
                }
              />

              <span>
                Li e aceito a{' '}
                <Link
                  to="/privacidade"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded font-bold text-[#1478b8] underline focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Política de privacidade
                </Link>{' '}
                
              </span>
            </label>
          </div>

          {erro && !campoComErro && (
            <div
              role="alert"
              aria-live="polite"
              className="ev-cadastro-global-error rounded-lg border border-red-900/50 bg-red-950/50 p-3 text-center text-sm font-semibold text-red-300"
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            aria-busy={carregando}
            className="ev-btn-primary mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-800 text-base font-bold text-white hover:from-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#081629] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando && (
              <Loader2
                className="animate-spin"
                size={18}
                aria-hidden="true"
              />
            )}

            {carregando
              ? 'Criando conta...'
              : 'Finalizar cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}