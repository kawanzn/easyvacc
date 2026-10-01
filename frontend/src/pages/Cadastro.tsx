import { useState } from 'react';
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
  const [temaClaro] = useState(() => {
    return localStorage.getItem('easyvacc-tema') === 'claro';
  });

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

  const campo =
    'w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3.5 text-base text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none';

  return (
    <div className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 font-sans text-slate-100 ${temaClaro ? 'easyvacc-cadastro-light' : ''}`}>
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
        .easyvacc-cadastro-light [class~="bg-slate-900"],
        .easyvacc-cadastro-light [class~="bg-slate-900/80"],
        .easyvacc-cadastro-light [class~="bg-slate-900/90"] {
          background-color: #ffffff !important;
        }
        .easyvacc-cadastro-light [class~="bg-slate-950"],
        .easyvacc-cadastro-light [class~="bg-slate-950/80"] {
          background-color: #ffffff !important;
        }
        .easyvacc-cadastro-light [class~="border-slate-800"],
        .easyvacc-cadastro-light [class~="border-slate-700"] {
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
        .easyvacc-cadastro-light [class~="hover:bg-slate-900"]:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>

      <Link
        to="/login"
        className="absolute top-6 left-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-slate-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar ao login
      </Link>

      <div className="my-8 w-full max-w-xl rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-2xl md:p-10">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white">
            Criar nova conta
          </h2>

          <p className="mt-2 text-base text-slate-200">
            Ou{' '}
            <Link
              to="/login"
              className="rounded font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              já tenho uma conta
            </Link>
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={handleCadastro}
          noValidate
        >
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
            />
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
              />

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
              />

              <p className="mt-1 text-xs leading-5 text-slate-300">
                Opcional. Se informado, deve conter um CNS válido com 15 dígitos.
              </p>
            </div>
          </div>

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
            />
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
            />
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
              />
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
              />
            </div>
          </div>

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
                aria-describedby="senha-requisitos"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha(
                    (valor) =>
                      !valor
                  )
                }
                className="absolute inset-y-0 right-0 min-w-11 rounded-r-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-400"
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
            />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-200">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                aria-required="true"
                className="mt-1 h-5 w-5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                  className="rounded font-bold text-[#00a884] underline focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  Termos de uso
                </Link>{' '}
                (versão{' '}
                {TERMOS_VERSAO}
                ).
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                aria-required="true"
                className="mt-1 h-5 w-5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                  className="rounded font-bold text-[#00a884] underline focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  Política de privacidade
                </Link>{' '}
                (versão{' '}
                {
                  PRIVACIDADE_VERSAO
                }
                ).
              </span>
            </label>
          </div>

          {erro && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-red-900/50 bg-red-950/50 p-3 text-center text-sm font-semibold text-red-300"
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            aria-busy={carregando}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-bold text-white hover:from-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
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