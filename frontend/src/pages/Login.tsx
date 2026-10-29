import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, ShieldCheck, ArrowRight, UserRound, Moon, Sun, Fingerprint } from 'lucide-react';
import { supabase } from '../services/supabase';
import { cpfValido, mascaraCpf, salvarPessoaAtiva, soDigitos } from '../lib/brasil';
import { passkeysDisponiveis, mensagemErroPasskey } from '../lib/passkeys';

export default function Login() {
  const [temaClaro, setTemaClaro] = useState(() => localStorage.getItem('easyvacc-tema') === 'claro');
  const alternarTema = () => {
    const proximo = !temaClaro;
    setTemaClaro(proximo);
    localStorage.setItem('easyvacc-tema', proximo ? 'claro' : 'escuro');
    window.dispatchEvent(new Event('easyvacc-tema-atualizado'));
    window.dispatchEvent(new Event('easyvaccTemaAtualizado'));
  };
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [entrandoComPasskey, setEntrandoComPasskey] = useState(false);
  const navigate = useNavigate();

  // Validação de perfil única para login por CPF e por Passkey.
  const concluirEntrada = async (idAutenticado: string): Promise<void> => {
    const { data: usuario, error: perfilError } = await supabase
      .from('users')
      .select('id, nome, email, cpf, cns, cidade')
      .eq('id', idAutenticado)
      .single();

    if (perfilError || !usuario || usuario.id !== idAutenticado) {
      await supabase.auth.signOut();
      throw new Error('Não foi possível validar os dados da sua conta.');
    }

    localStorage.setItem('usuarioId', usuario.id);
    salvarPessoaAtiva({
      tipo: 'titular',
      id: usuario.id,
      nome: usuario.nome,
    });
    navigate('/dashboard');
  };

  const entrarComBiometria = async () => {
    setErro('');
    if (!passkeysDisponiveis()) {
      setErro('A biometria não está disponível neste navegador ou conexão. Use HTTPS ou localhost.');
      return;
    }

    setEntrandoComPasskey(true);
    try {
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;
      if (!data?.session || !data?.user) {
        throw new Error('O Supabase não retornou uma sessão válida.');
      }
      await concluirEntrada(data.user.id);
    } catch (error) {
      console.error('Erro no login com Passkey:', error);
      setErro(mensagemErroPasskey(error, 'Não foi possível entrar com biometria.'));
    } finally {
      setEntrandoComPasskey(false);
    }
  };
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');

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

      // A Edge Function localiza o e-mail e valida a senha no servidor.
      // O e-mail cadastrado não é exposto ao navegador.
      const { data: loginData, error: loginError } =
        await supabase.functions.invoke('login-cpf', {
          body: {
            cpf: cpfLimpo,
            senha,
          },
        });

      if (loginError) {
        console.error(
          'Erro na autenticação por CPF:',
          loginError
        );

        const mensagemServidor =
          loginData &&
          typeof loginData === 'object' &&
          'error' in loginData &&
          typeof loginData.error === 'string'
            ? loginData.error
            : '';

        setErro(
          mensagemServidor ||
            'Não foi possível entrar. Verifique o CPF e a senha.'
        );
        return;
      }

      if (
        !loginData?.access_token ||
        !loginData?.refresh_token
      ) {
        setErro(
          loginData?.error ||
            'Não foi possível entrar. Verifique o CPF e a senha.'
        );
        return;
      }

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.setSession({
        access_token: loginData.access_token,
        refresh_token: loginData.refresh_token,
      });

      if (
        sessionError ||
        !sessionData.session ||
        !sessionData.user
      ) {
        console.error(
          'Erro ao instalar sessão:',
          sessionError
        );

        setErro(
          'Não foi possível validar sua sessão.'
        );
        return;
      }

      await concluirEntrada(sessionData.user.id);
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
    <main className={`relative isolate h-[100dvh] overflow-hidden font-sans ${temaClaro ? "bg-slate-100 text-slate-900" : "bg-[#020817] text-white"}`}>
      {/* Coloque uma foto de vacinação em public/login-fundo.jpg */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[url('/login-fundo.jpg')] bg-cover bg-center"
      />
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 ${temaClaro ? "bg-gradient-to-r from-[#163451]/75 via-[#345775]/30 to-[#102a45]/45" : "bg-gradient-to-r from-[#020817]/95 via-[#031626]/75 to-[#020817]/85"}`} />

      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col px-4 py-2 sm:px-7 lg:px-10 lg:py-3">
        <header className="flex shrink-0 items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="EasyVacc - página inicial">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-md">
              <img src="/logo.png" alt="" className="h-full w-full object-contain" />
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-white">Easy<span className="text-[#1478b8]">Vacc</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" onClick={alternarTema} aria-label={temaClaro ? 'Ativar tema escuro' : 'Ativar tema claro'} title={temaClaro ? 'Tema escuro' : 'Tema claro'} className={`flex h-10 w-10 min-h-10 min-w-10 shrink-0 aspect-square items-center justify-center !rounded-full border transition ${temaClaro ? "border-slate-400 bg-white text-slate-900 hover:bg-slate-100" : "border-[#1478b8] bg-[#061426] text-yellow-400 hover:bg-[#0d253b]"}`}>
              {temaClaro ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <Link to="/" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/30 bg-slate-950/25 px-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-slate-950/45">
              <ArrowLeft size={16} /><span className="hidden sm:inline">Voltar ao início</span><span className="sm:hidden">Voltar</span>
            </Link>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 items-center gap-4 py-1 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] lg:gap-8">
          <section className={`hidden min-h-0 flex-col justify-center lg:flex text-white`}>
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-[#061d3a]/45 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
              <ShieldCheck size={18} className="text-[#1478b8]" /> Sua saúde, organizada em um só lugar
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-tight xl:text-6xl">
              Vacinação é <span className="text-[#1478b8]">proteção para toda a vida.</span>
            </h1>
            <div className="mt-5 h-1.5 w-16 rounded-full bg-[#1478b8]" />
            <p className={`mt-4 max-w-xl text-base leading-6 text-slate-100`}>
              Com o EasyVacc, acompanhe seu histórico de vacinas e mantenha sua saúde e a de sua família em dia.
            </p>
            <div className="mt-7 flex flex-wrap gap-5 xl:gap-8">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#1478b8]"><ShieldCheck size={23} /></span><span className="text-sm font-semibold">Mais<br />segurança</span></div>
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#1478b8]"><Lock size={22} /></span><span className="text-sm font-semibold">Acesso<br />protegido</span></div>
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#1478b8]"><ShieldCheck size={23} /></span><span className="text-sm font-semibold">Caderneta<br />digital</span></div>
            </div>
          </section>

          <section aria-labelledby="login-title" className={`mx-auto w-full max-w-[460px] min-h-0 max-h-full overflow-y-auto rounded-[24px] border p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5 lg:p-5 ${temaClaro ? "border-white/85 bg-white/95 text-[#102b49]" : "border-[#304760] bg-[#081629]/95 text-white"}`}>
            <div className="mb-3 text-center">
              <div className="mb-2 flex items-center justify-center gap-2.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100"><img src="/logo.png" alt="" className="h-full w-full object-contain" /></span>
                <span className={`text-2xl font-extrabold tracking-tight ${temaClaro ? "text-[#102b49]" : "text-white"}`}>Easy<span className="text-[#1478b8]">Vacc</span></span>
              </div>
              <h2 id="login-title" className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${temaClaro ? "text-[#102b49]" : "text-white"}`}>Bem-vindo(a)!</h2>
              <p className={`mt-1.5 text-sm leading-5 ${temaClaro ? "text-slate-600" : "text-slate-200"}`}>Entre com seu CPF e senha para acessar sua caderneta de vacinação.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label htmlFor="cpf" className={`mb-1.5 block text-sm font-bold ${temaClaro ? "text-[#102b49]" : "text-white"}`}>CPF</label>
                <div className="relative">
                  <UserRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1351a5]" />
                  <input id="cpf" type="text" inputMode="numeric" autoComplete="username" placeholder="Digite seu CPF" value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} required className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#1351a5] focus:ring-4 focus:ring-blue-100" />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2"><label htmlFor="senha" className={`text-sm font-bold ${temaClaro ? "text-[#102b49]" : "text-white"}`}>Senha</label><Link to="/recuperar-senha" className={`text-xs font-semibold hover:underline sm:text-sm ${temaClaro ? "text-[#126ca8]" : "text-[#83caff]"}`}>Esqueci minha senha</Link></div>
                <div className="relative">
                  <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1351a5]" />
                  <input id="senha" type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))} required className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-12 text-base text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#1351a5] focus:ring-4 focus:ring-blue-100" />
                  <button type="button" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-[#1351a5]">{mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                </div>
                {capsLock && <p className="mt-1 text-xs font-semibold text-amber-300">A tecla Caps Lock está ativada.</p>}
              </div>

              {erro && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{erro}</div>}
              <button type="submit" disabled={carregando} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#126ca8] px-4 font-bold text-white transition hover:bg-[#105b90] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60">
                {carregando ? <><Loader2 size={18} className="animate-spin" /> Entrando...</> : <>Entrar na caderneta <ArrowRight size={18} /></>}
              </button>
            </form>

            <button
              type="button"
              onClick={() => void entrarComBiometria()}
              disabled={carregando || entrandoComPasskey || !passkeysDisponiveis()}
              className={`mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${temaClaro ? 'border-[#126ca8] bg-blue-50 text-[#105b90] hover:bg-blue-100' : 'border-[#3186c0] bg-[#102b49] text-white hover:bg-[#183e65]'}`}
            >
              {entrandoComPasskey ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={19} />}
              {entrandoComPasskey ? 'Verificando biometria...' : 'Entrar com biometria / Face ID'}
            </button>
            {!passkeysDisponiveis() && (
              <p className={`mt-1 text-center text-[11px] ${temaClaro ? 'text-slate-500' : 'text-slate-300'}`}>
                Biometria indisponível neste navegador ou conexão.
              </p>
            )}

            <div className={`my-2 flex items-center gap-3 text-[10px] font-semibold tracking-wide ${temaClaro ? "text-slate-500" : "text-slate-300"}`}><span className={`h-px flex-1 ${temaClaro ? "bg-slate-300" : "bg-white/25"}`} />AINDA NÃO TEM CONTA?<span className={`h-px flex-1 ${temaClaro ? "bg-slate-300" : "bg-white/25"}`} /></div>
            <Link to="/cadastro" className={`flex h-10 w-full items-center justify-center rounded-lg border border-[#126ca8] text-sm font-bold transition ${temaClaro ? "bg-white text-[#105b90] hover:bg-blue-50" : "bg-[#102b49] text-white hover:bg-[#183e65]"}`}>Criar minha conta</Link>
            <div className={`mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t pt-3 text-xs font-medium ${temaClaro ? "border-slate-200 text-[#126ca8]" : "border-white/20 text-[#83caff]"}`}><Link to="/privacidade" className="hover:underline">Política de Privacidade</Link><Link to="/termos" className="hover:underline">Termos de Uso</Link></div>
          </section>
        </div>
        <footer className="hidden shrink-0 pb-1 text-center text-[11px] text-white/80 lg:block">EasyVacc • Caderneta Digital de Vacinação</footer>
      </div>
    </main>
  );
}
