import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { senhaAtendeRequisitos } from '../lib/brasil';

export default function RedefinirSenha() {
  const [temaClaro, setTemaClaro] = useState(() => localStorage.getItem('easyvacc-tema') === 'claro');
  useEffect(() => {
    const atualizarTema = () => setTemaClaro(localStorage.getItem('easyvacc-tema') === 'claro');
    window.addEventListener('storage', atualizarTema);
    window.addEventListener('easyvacc-tema-atualizado', atualizarTema);
    window.addEventListener('easyvaccTemaAtualizado', atualizarTema);
    return () => {
      window.removeEventListener('storage', atualizarTema);
      window.removeEventListener('easyvacc-tema-atualizado', atualizarTema);
      window.removeEventListener('easyvaccTemaAtualizado', atualizarTema);
    };
  }, []);

  const navigate = useNavigate();
  // O Supabase identifica links de convite pelo parâmetro type=invite.
  // Guardamos a origem antes que o cliente Auth processe o hash da URL.
  const [conviteProfissional] = useState(() => {
    const parametros = new URLSearchParams(window.location.search);
    const fragmento = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return parametros.get('origem') === 'convite-profissional' ||
      parametros.get('type') === 'invite' || fragmento.get('type') === 'invite';
  });

  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [acessoValido, setAcessoValido] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState('');
  const urlPortalProfissional = 'https://easyvacc.com.br/login-profissional';

  const copiarEndereco = async () => {
    try {
      await navigator.clipboard.writeText(urlPortalProfissional);
      setLinkCopiado(true);
      setErroCopia('');
    } catch {
      setErroCopia('Não foi possível copiar automaticamente. Selecione o endereço acima e copie-o.');
    }
  };

  useEffect(() => {
    let montado = true;

    const verificarSessao = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (montado && session) {
        setAcessoValido(true);
      }

      if (montado) {
        setVerificando(false);
      }
    };

    void verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && session)
      ) {
        setAcessoValido(true);
        setVerificando(false);
      }
    });

    return () => {
      montado = false;
      subscription.unsubscribe();
    };
  }, []);

  const redefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();

    setErro('');

    if (!senhaAtendeRequisitos(senha)) {
      setErro(
        'A senha deve ter no mínimo 8 caracteres, com letras e números.'
      );
      return;
    }

    if (senha !== confirmacao) {
      setErro('As senhas precisam ser idênticas.');
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) {
        throw error;
      }

      if (conviteProfissional) {
        // Encerra a sessão temporária do convite antes do login profissional.
        const { error: erroSaida } = await supabase.auth.signOut();
        if (erroSaida) {
          console.warn('Não foi possível encerrar a sessão do convite:', erroSaida);
        }
      }

      setSucesso(true);

      if (!conviteProfissional) {
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar sua senha.'
      );
    } finally {
      setCarregando(false);
    }
  };

  if (verificando) {
    return (
      <div className={`ev-public-page ${temaClaro ? "ev-public-light" : ""} flex min-h-screen items-center justify-center bg-[#020817] text-slate-100`}>
      <style>{`
        .ev-public-light { background:#f5f9ff !important; color:#102b49 !important; }
        .ev-public-light [class~="bg-[#020817]"],
        .ev-public-light [class~="bg-[#090d16]"] {background:#f5f9ff !important;}
        .ev-public-light [class~="bg-[#081629]"],
        .ev-public-light [class~="bg-[#111827]"],
        .ev-public-light [class~="bg-[#0d1420]"] {background:#fff !important;}
        .ev-public-light [class~="text-white"],
        .ev-public-light [class~="text-slate-100"],
        .ev-public-light [class~="text-slate-200"] {color:#102b49 !important;}
        .ev-public-light [class~="text-slate-300"] {color:#34516e !important;}
        .ev-public-light [class~="text-slate-400"],
        .ev-public-light [class~="text-slate-500"],
        .ev-public-light [class~="text-slate-600"] {color:#526d87 !important;}
        .ev-public-light [class~="border-slate-800"],
        .ev-public-light [class~="border-slate-700"] {border-color:#d1e0ef !important;}
        .ev-public-light input {background:#fff !important; color:#102b49 !important; border-color:#b8ccdf !important;}
        .ev-public-light input::placeholder {color:#647e98 !important;}
        .ev-public-light .text-blue-300,
        .ev-public-light .text-blue-500 {color:#126ca8 !important;}
        .ev-public-light .bg-blue-600\\/10 {background:#e8f3ff !important;}
        .ev-public-light .text-red-300 {color:#b42336 !important;}
        .ev-public-light .text-amber-300 {color:#9b6000 !important;}
        .ev-public-light [class~="bg-[#126ca8]"] {color:white !important;}
        @media(max-width:640px) {
          .ev-public-page > div {max-width:100%;}
          .ev-public-page input {font-size:16px;}
        }
`}</style>
        <div className="text-center">
          <Loader2
            className="mx-auto animate-spin text-blue-500"
            size={28}
          />

          <p className="mt-3 text-sm text-slate-400">
            Validando link...
          </p>
        </div>
      </div>
    );
  }

  if (!acessoValido) {
    return (
      <div className={`ev-public-page ${temaClaro ? "ev-public-light" : ""} flex min-h-screen items-center justify-center bg-[#020817] p-4 text-slate-100`}>
      <style>{`
        .ev-public-light { background:#f5f9ff !important; color:#102b49 !important; }
        .ev-public-light [class~="bg-[#020817]"],
        .ev-public-light [class~="bg-[#090d16]"] {background:#f5f9ff !important;}
        .ev-public-light [class~="bg-[#081629]"],
        .ev-public-light [class~="bg-[#111827]"],
        .ev-public-light [class~="bg-[#0d1420]"] {background:#fff !important;}
        .ev-public-light [class~="text-white"],
        .ev-public-light [class~="text-slate-100"],
        .ev-public-light [class~="text-slate-200"] {color:#102b49 !important;}
        .ev-public-light [class~="text-slate-300"] {color:#34516e !important;}
        .ev-public-light [class~="text-slate-400"],
        .ev-public-light [class~="text-slate-500"],
        .ev-public-light [class~="text-slate-600"] {color:#526d87 !important;}
        .ev-public-light [class~="border-slate-800"],
        .ev-public-light [class~="border-slate-700"] {border-color:#d1e0ef !important;}
        .ev-public-light input {background:#fff !important; color:#102b49 !important; border-color:#b8ccdf !important;}
        .ev-public-light input::placeholder {color:#647e98 !important;}
        .ev-public-light .text-blue-300,
        .ev-public-light .text-blue-500 {color:#126ca8 !important;}
        .ev-public-light .bg-blue-600\\/10 {background:#e8f3ff !important;}
        .ev-public-light .text-red-300 {color:#b42336 !important;}
        .ev-public-light .text-amber-300 {color:#9b6000 !important;}
        .ev-public-light [class~="bg-[#126ca8]"] {color:white !important;}
        @media(max-width:640px) {
          .ev-public-page > div {max-width:100%;}
          .ev-public-page input {font-size:16px;}
        }
`}</style>
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#081629] p-5 sm:p-8 text-center">
          <KeyRound
            className="mx-auto text-slate-500"
            size={32}
          />

          <h1 className="mt-4 text-xl font-bold text-white">
            Link inválido ou expirado
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {conviteProfissional
              ? 'Peça ao administrador um novo convite de acesso profissional.'
              : 'Solicite um novo link para redefinir sua senha.'}
          </p>

          {!conviteProfissional && <Link
            to="/recuperar-senha"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#126ca8] px-5 font-bold text-white"
          >
            Solicitar novo link
          </Link>}
        </div>
      </div>
    );
  }

  return (
    <div className={`ev-public-page ${temaClaro ? "ev-public-light" : ""} flex min-h-screen items-center justify-center bg-[#020817] p-4 text-slate-100`}>
      <style>{`
        .ev-public-light { background:#f5f9ff !important; color:#102b49 !important; }
        .ev-public-light [class~="bg-[#020817]"],
        .ev-public-light [class~="bg-[#090d16]"] {background:#f5f9ff !important;}
        .ev-public-light [class~="bg-[#081629]"],
        .ev-public-light [class~="bg-[#111827]"],
        .ev-public-light [class~="bg-[#0d1420]"] {background:#fff !important;}
        .ev-public-light [class~="text-white"],
        .ev-public-light [class~="text-slate-100"],
        .ev-public-light [class~="text-slate-200"] {color:#102b49 !important;}
        .ev-public-light [class~="text-slate-300"] {color:#34516e !important;}
        .ev-public-light [class~="text-slate-400"],
        .ev-public-light [class~="text-slate-500"],
        .ev-public-light [class~="text-slate-600"] {color:#526d87 !important;}
        .ev-public-light [class~="border-slate-800"],
        .ev-public-light [class~="border-slate-700"] {border-color:#d1e0ef !important;}
        .ev-public-light input {background:#fff !important; color:#102b49 !important; border-color:#b8ccdf !important;}
        .ev-public-light input::placeholder {color:#647e98 !important;}
        .ev-public-light .text-blue-300,
        .ev-public-light .text-blue-500 {color:#126ca8 !important;}
        .ev-public-light .bg-blue-600\\/10 {background:#e8f3ff !important;}
        .ev-public-light .text-red-300 {color:#b42336 !important;}
        .ev-public-light .text-amber-300 {color:#9b6000 !important;}
        .ev-public-light [class~="bg-[#126ca8]"] {color:white !important;}
        @media(max-width:640px) {
          .ev-public-page > div {max-width:100%;}
          .ev-public-page input {font-size:16px;}
        }
`}</style>
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#081629] p-5 sm:p-8 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500">
          <KeyRound size={22} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-white">
          {conviteProfissional ? 'Crie sua senha profissional' : 'Criar nova senha'}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {conviteProfissional
            ? 'Defina uma senha para acessar a área profissional do EasyVacc.'
            : 'Digite sua nova senha para acessar o EasyVacc.'}
        </p>

        {sucesso ? (
          conviteProfissional ? (
            <div className="mt-7 space-y-4">
              <div className="rounded-xl border border-blue-600/30 bg-blue-600/10 p-5 text-center">
                <CheckCircle2 className="mx-auto text-blue-500" size={36} />
                <h2 className="mt-3 text-lg font-bold text-white">Conta ativada com sucesso!</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Sua senha foi cadastrada. O Portal Profissional EasyVacc está pronto para seu acesso.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-[#020817] p-4">
                <p className="text-sm font-semibold text-slate-200">Seu endereço de acesso</p>
                <p className="mt-2 break-all select-all text-sm text-blue-300">{urlPortalProfissional}</p>
                <button
                  type="button"
                  onClick={copiarEndereco}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-500"
                >
                  <Copy size={16} />
                  {linkCopiado ? 'Endereço copiado!' : 'Copiar endereço'}
                </button>
                {erroCopia && <p className="mt-2 text-xs text-amber-300">{erroCopia}</p>}
              </div>

              <Link
                to="/login-profissional"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#126ca8] px-4 text-center font-bold text-white transition hover:bg-blue-500"
              >
                Acessar Portal Profissional <ExternalLink size={17} />
              </Link>
              <p className="text-center text-xs leading-5 text-slate-400">
                Guarde esse endereço para seus próximos acessos. Entre com o e-mail do convite e sua nova senha.
              </p>
            </div>
          ) : (
            <div className="mt-7 rounded-xl border border-blue-600/30 bg-blue-600/10 p-5">
              <div className="flex gap-3">
                <CheckCircle2 className="shrink-0 text-blue-500" size={21} />
                <div>
                  <p className="font-semibold text-blue-300">Senha alterada</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Sua senha foi atualizada. Você será direcionado para o login.
                  </p>
                </div>
              </div>
            </div>
          )
        ) : (
          <form
            onSubmit={redefinirSenha}
            className="mt-7 space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Nova senha
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                placeholder="Nova senha"
                required
                className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3.5 text-white outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Confirmar nova senha
              </label>

              <input
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                required
                className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3.5 text-white outline-none focus:border-blue-600"
              />
            </div>

            {erro && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-300">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#126ca8] font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {carregando && (
                <Loader2
                  className="animate-spin"
                  size={18}
                />
              )}

              {carregando
                ? 'Alterando...'
                : 'Redefinir senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}