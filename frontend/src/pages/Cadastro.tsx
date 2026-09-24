import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
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

export default function Cadastro() {
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

    // ==============================
    // VALIDAÇÕES
    // ==============================

    if (!cpfValido(cpf)) {
      setErro('Informe um CPF válido. O cadastro não foi enviado.');
      return;
    }

    if (!cnsValido(cns)) {
      setErro(
        'Informe um Cartão Nacional de Saúde válido. O cadastro não foi enviado.'
      );
      return;
    }

    if (
      email.trim().toLowerCase() !==
      emailConfirmacao.trim().toLowerCase()
    ) {
      setErro('Os e-mails digitados não coincidem.');
      return;
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

      // ==========================================
      // 1. VERIFICAR CPF
      // ==========================================

      const { data: usuarioCpf, error: erroCpf } = await supabase
        .from('users')
        .select('id')
        .eq('cpf', cpfNormalizado)
        .maybeSingle();

      if (erroCpf) {
        throw erroCpf;
      }

      if (usuarioCpf) {
        setErro('Este CPF já está cadastrado.');
        return;
      }

      // ==========================================
      // 2. VERIFICAR CNS
      // ==========================================

      const { data: usuarioCns, error: erroCns } = await supabase
        .from('users')
        .select('id')
        .eq('cns', cnsNormalizado)
        .maybeSingle();

      if (erroCns) {
        throw erroCns;
      }

      if (usuarioCns) {
        setErro('Este Cartão Nacional de Saúde já está cadastrado.');
        return;
      }

      // ==========================================
      // 3. CRIAR USUÁRIO NO SUPABASE AUTH
      // ==========================================

console.log('### CADASTRO NOVO COM SUPABASE ###');

      const { data: authData, error: authError } =
await supabase.auth.signUp({
  email: emailNormalizado,
  password: senha,

  options: {
    emailRedirectTo: `${window.location.origin}/login`,

    data: {
      nome: nome.trim(),
    },
  },
});

      if (authError) {
        console.error('Erro no Supabase Auth:', authError);

        if (
          authError.message
            .toLowerCase()
            .includes('already registered')
        ) {
          setErro('Este e-mail já está cadastrado.');
          return;
        }

        throw authError;
      }

      if (!authData.user) {
        throw new Error(
          'Não foi possível criar o usuário no sistema de autenticação.'
        );
      }

      // ==========================================
      // 4. SALVAR PERFIL NA TABELA users
      // ==========================================

      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,

            nome: nome.trim(),

            cpf: cpfNormalizado,

            cns: cnsNormalizado,

            email: emailNormalizado,

            cidade: cidade.trim(),

            data_nascimento:
              dataNascimento !== ''
                ? dataNascimento
                : null,

            termos_aceitos_em:
              new Date().toISOString(),

            privacidade_aceita_em:
              new Date().toISOString(),

            termos_versao:
              TERMOS_VERSAO,

            privacidade_versao:
              PRIVACIDADE_VERSAO,
          },
        ]);

      if (profileError) {
        console.error(
          'Erro ao criar perfil:',
          profileError
        );

        if (profileError.code === '23505') {
          setErro(
            'CPF, CNS ou e-mail já cadastrado.'
          );
          return;
        }

        throw profileError;
      }

      // ==========================================
      // 5. CADASTRO REALIZADO
      // ==========================================

      console.log(
        'Usuário cadastrado:',
        authData.user
      );

      // Se confirmação de e-mail estiver habilitada
      if (!authData.session) {
        navigate('/confirmar-email', {
          state: {
            email: emailNormalizado,

            mensagem:
              'Cadastro realizado. Verifique seu e-mail para confirmar sua conta.',
          },
        });

        return;
      }

      // Caso confirmação esteja desabilitada
      navigate('/login');

    } catch (error) {
      console.error(
        'Erro no cadastro:',
        error
      );

      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro(
          'Não foi possível realizar o cadastro.'
        );
      }

    } finally {
      setCarregando(false);
    }
  };

  const campo =
    'w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3.5 text-base text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 font-sans text-slate-100">

      <Link
        to="/login"
        className="absolute top-6 left-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white"
      >
        <ArrowLeft size={16} />
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
              className="font-bold text-emerald-400"
            >
              já tenho uma conta
            </Link>

          </p>

        </div>

        <form
          className="space-y-5"
          onSubmit={handleCadastro}
        >

          {/* NOME */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Nome completo *
            </label>

            <input
              required
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              className={campo}
              placeholder="Seu nome completo"
            />

          </div>

          {/* CPF + CNS */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-200">
                CPF *
              </label>

              <input
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
              />

              <p className="mt-1 text-xs leading-5 text-slate-300">
                Identifica sua conta e o acesso.
              </p>

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Cartão Nacional de Saúde *
              </label>

              <input
                required
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
              />

              <p className="mt-1 text-xs leading-5 text-slate-300">
                Associa a caderneta ao identificador usado na rede pública.
              </p>

            </div>

          </div>

          {/* EMAIL */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-200">
              E-mail *
            </label>

            <input
              required
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className={campo}
              placeholder="seu@email.com"
              autoComplete="email"
            />

          </div>

          {/* CONFIRMAÇÃO EMAIL */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Confirmar e-mail *
            </label>

            <input
              required
              type="email"
              value={emailConfirmacao}
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

          {/* CIDADE + NASCIMENTO */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Cidade *
              </label>

              <input
                required
                value={cidade}
                onChange={(e) =>
                  setCidade(e.target.value)
                }
                className={campo}
                placeholder="Sua cidade"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Data de nascimento
              </label>

              <input
                type="date"
                value={dataNascimento}
                onChange={(e) =>
                  setDataNascimento(
                    e.target.value
                  )
                }
                className={campo}
              />

            </div>

          </div>

          {/* SENHA */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Senha *
            </label>

            <div className="relative">

              <input
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
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha(
                    (v) => !v
                  )
                }
                className="absolute inset-y-0 right-0 min-w-11 text-slate-300"
                aria-label="Mostrar ou ocultar senha"
              >

                {mostrarSenha ? (
                  <EyeOff
                    size={18}
                    className="mx-auto"
                  />
                ) : (
                  <Eye
                    size={18}
                    className="mx-auto"
                  />
                )}

              </button>

            </div>

          </div>

          {/* CONFIRMAÇÃO SENHA */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Confirmar senha *
            </label>

            <input
              required
              type={
                mostrarSenha
                  ? 'text'
                  : 'password'
              }
              value={senhaConfirmacao}
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

          {/* TERMOS */}

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-200">

            <label className="flex items-start gap-3">

              <input
                type="checkbox"
                className="mt-1 h-5 w-5"
                checked={aceiteTermos}
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
                  className="font-bold text-[#00a884] underline"
                >
                  Termos de uso
                </Link>{' '}

                (versão {TERMOS_VERSAO}).
              </span>

            </label>

            <label className="flex items-start gap-3">

              <input
                type="checkbox"
                className="mt-1 h-5 w-5"
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
                  className="font-bold text-[#00a884] underline"
                >
                  Política de privacidade
                </Link>{' '}

                (versão {PRIVACIDADE_VERSAO}).
              </span>

            </label>

          </div>

          {/* ERRO */}

          {erro && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/50 p-3 text-center text-sm font-semibold text-red-300">
              {erro}
            </div>
          )}

          {/* BOTÃO */}

          <button
            type="submit"
            disabled={carregando}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-bold text-white hover:from-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {carregando && (
              <Loader2
                className="animate-spin"
                size={18}
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