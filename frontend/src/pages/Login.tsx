import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from 'lucide-react';

import { supabase } from '../services/supabase';

import {
  cpfValido,
  mascaraCpf,
  salvarPessoaAtiva,
  soDigitos,
} from '../lib/brasil';

export default function Login() {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // ==============================
    // 1. VALIDAR CPF
    // ==============================

    if (!cpfValido(cpf)) {
      setErro('Informe um CPF válido.');
      return;
    }

    if (!senha) {
      setErro('Informe sua senha.');
      return;
    }

    setCarregando(true);

    try {
      const cpfLimpo = soDigitos(cpf);

      // ==============================
      // 2. DESCOBRIR O E-MAIL PELO CPF
      // ==============================

      const {
        data: emailUsuario,
        error: emailError,
      } = await supabase.rpc(
        'buscar_email_por_cpf',
        {
          p_cpf: cpfLimpo,
        }
      );

      if (emailError) {
        console.error(
          'Erro ao localizar usuário:',
          emailError
        );

        throw emailError;
      }

      if (!emailUsuario) {
        setErro(
          'Não foi possível entrar. Verifique o CPF e a senha.'
        );
        return;
      }

      // ==============================
      // 3. LOGIN NO SUPABASE AUTH
      // ==============================

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: emailUsuario,
        password: senha,
      });

      if (authError) {
        console.error(
          'Erro no Supabase Auth:',
          authError
        );

        const mensagem =
          authError.message.toLowerCase();

        if (
          mensagem.includes('email not confirmed')
        ) {
          setErro(
            'Confirme seu e-mail antes de entrar.'
          );
          return;
        }

        if (
          mensagem.includes('invalid login credentials')
        ) {
          setErro(
            'Não foi possível entrar. Verifique o CPF e a senha.'
          );
          return;
        }

        setErro(
          'Não foi possível entrar. Verifique o CPF e a senha.'
        );

        return;
      }

      if (!authData.user) {
        setErro(
          'Não foi possível validar sua conta.'
        );
        return;
      }

      // ==============================
      // 4. BUSCAR PERFIL DO USUÁRIO
      // Agora o usuário está autenticado,
      // então o RLS permite o SELECT.
      // ==============================

      const {
        data: usuario,
        error: perfilError,
      } = await supabase
        .from('users')
        .select(`
          id,
          nome,
          email,
          cpf,
          cns,
          cidade
        `)
        .eq('id', authData.user.id)
        .single();

      if (perfilError) {
        console.error(
          'Erro ao carregar perfil:',
          perfilError
        );

        await supabase.auth.signOut();

        setErro(
          'Não foi possível carregar os dados da sua conta.'
        );

        return;
      }

      if (!usuario) {
        await supabase.auth.signOut();

        setErro(
          'Perfil do usuário não encontrado.'
        );

        return;
      }

      // ==============================
      // 5. SEGURANÇA:
      // confirmar se Auth e perfil
      // pertencem à mesma pessoa
      // ==============================

      if (usuario.id !== authData.user.id) {
        console.error(
          'ID do Auth diferente do perfil.'
        );

        await supabase.auth.signOut();

        setErro(
          'Não foi possível validar sua conta.'
        );

        return;
      }

      // ==============================
      // 6. SALVAR USUÁRIO ATIVO
      // ==============================

      localStorage.setItem(
        'usuarioId',
        usuario.id
      );

      salvarPessoaAtiva({
        tipo: 'titular',
        id: usuario.id,
        nome: usuario.nome,
      });

      // ==============================
      // 7. IR PARA DASHBOARD
      // ==============================

      navigate('/dashboard');

    } catch (error) {
      console.error(
        'Erro ao realizar login:',
        error
      );

      setErro(
        'Não foi possível entrar. Tente novamente.'
      );

    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 font-sans text-slate-100 antialiased">

      {/* FUNDO */}

      <div className="absolute top-[-10%] left-[-5%] -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="absolute right-[-5%] bottom-[-10%] -z-10 h-96 w-96 rounded-full bg-[#00a884]/10 blur-3xl" />

      {/* VOLTAR */}

      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 text-sm font-semibold text-slate-200 hover:text-white"
      >
        <ArrowLeft size={16} />

        Voltar ao início
      </Link>

      {/* CARD */}

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl md:p-10">

        {/* LOGO */}

        <div className="mb-8 flex flex-col items-center text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-white p-1.5">

            <img
              src="/logo.png"
              alt="EasyVacc"
              className="h-full w-full object-contain"
            />

          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">

            Entrar no{' '}

            <span className="text-[#00a884]">
              EasyVacc
            </span>

          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-200">
            Use seu CPF e senha para acessar sua caderneta.
          </p>

        </div>

        {/* FORMULÁRIO */}

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          {/* CPF */}

          <div>

            <label
              htmlFor="cpf"
              className="mb-2 block text-sm font-bold tracking-wide text-slate-200 uppercase"
            >
              CPF
            </label>

            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) =>
                setCpf(
                  mascaraCpf(
                    e.target.value
                  )
                )
              }
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3.5 text-base text-white placeholder-slate-500 focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] focus:outline-none"
            />

          </div>

          {/* SENHA */}

          <div>

            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-bold tracking-wide text-slate-200 uppercase"
            >
              Senha
            </label>

            <div className="relative">

              <input
                id="senha"
                type={
                  mostrarSenha
                    ? 'text'
                    : 'password'
                }
                autoComplete="current-password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) =>
                  setSenha(
                    e.target.value
                  )
                }
                onKeyUp={(e) =>
                  setCapsLock(
                    e.getModifierState(
                      'CapsLock'
                    )
                  )
                }
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3.5 pr-12 text-base text-white placeholder-slate-500 focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] focus:outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha(
                    (v) => !v
                  )
                }
                className="absolute inset-y-0 right-0 inline-flex min-w-11 items-center justify-center text-slate-300 hover:text-white"
                aria-label={
                  mostrarSenha
                    ? 'Ocultar senha'
                    : 'Mostrar senha'
                }
              >

                {mostrarSenha ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}

              </button>

            </div>

            {capsLock && (
              <p className="mt-2 text-sm font-medium text-amber-300">
                A tecla Caps Lock está ativada.
              </p>
            )}

          </div>

          {/* ERRO */}

          {erro && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm font-semibold text-red-300">
              {erro}
            </div>
          )}

          {/* BOTÃO */}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00a884] to-teal-500 py-3.5 text-base font-bold text-slate-950 shadow-lg shadow-[#00a884]/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {carregando ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Lock size={18} />
            )}

            {carregando
              ? 'Entrando...'
              : 'Entrar na caderneta'}

          </button>

        </form>

        {/* LINKS */}

        <div className="mt-8 space-y-3 border-t border-slate-800 pt-6 text-center">

          <p className="text-sm text-slate-300">

            Ainda não tem caderneta?{' '}

            <Link
              to="/cadastro"
              className="font-bold text-[#00a884] hover:text-[#00c49a]"
            >
              Cadastre-se
            </Link>

          </p>

          <Link
            to="/recuperar-senha"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-300 hover:text-white"
          >
            Esqueci minha senha
          </Link>

          <div className="flex justify-center gap-4 pt-2 text-sm">

            <Link
              to="/privacidade"
              className="text-[#00a884] hover:underline"
            >
              Privacidade
            </Link>

            <Link
              to="/termos"
              className="text-[#00a884] hover:underline"
            >
              Termos
            </Link>

          </div>

          <Link
            to="/admin"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-400 hover:text-[#00a884]"
          >
            Acesso restrito: profissionais / posto
          </Link>

        </div>

      </div>

    </div>
  );
}