import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

import { supabase } from '../services/supabase';

export default function LoginProfissional() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();

    setErro('');
    setCarregando(true);

    try {
      // ==========================================
      // 1. LOGIN NO SUPABASE AUTH
      // ==========================================

      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (loginError) {
        throw new Error(
          'E-mail ou senha inválidos.'
        );
      }

      if (!data.user) {
        throw new Error(
          'Não foi possível autenticar o usuário.'
        );
      }

      // ==========================================
      // 2. VERIFICAR SE É PROFISSIONAL
      // ==========================================

      const {
        data: profissional,
        error: profissionalError,
      } = await supabase
        .from('profissionais')
        .select(`
          id,
          user_id,
          nome,
          tipo_profissional,
          registro_profissional,
          conselho,
          estabelecimento,
          ativo
        `)
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (profissionalError) {
        console.error(
          'Erro ao verificar profissional:',
          profissionalError
        );

        await supabase.auth.signOut();

        throw new Error(
          'Não foi possível verificar sua autorização.'
        );
      }

      // ==========================================
      // 3. NÃO É PROFISSIONAL
      // ==========================================

      if (!profissional) {
        await supabase.auth.signOut();

        throw new Error(
          'Esta conta não possui acesso profissional.'
        );
      }

      // ==========================================
      // 4. PROFISSIONAL DESATIVADO
      // ==========================================

      if (!profissional.ativo) {
        await supabase.auth.signOut();

        throw new Error(
          'Seu acesso profissional ainda não está autorizado.'
        );
      }

      // ==========================================
      // 5. ACESSO AUTORIZADO
      // ==========================================

      navigate('/admin', {
        replace: true,
      });
    } catch (error) {
      console.error(
        'Erro no login profissional:',
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível realizar o login.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-400">
            <ShieldCheck size={28} />
          </div>

          <h1 className="text-2xl font-black text-white">
            Acesso profissional
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Área exclusiva para profissionais autorizados.
          </p>
        </div>

        <form
          onSubmit={entrar}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              E-mail profissional
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="profissional@email.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-12 pr-4 text-white outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Senha
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="password"
                required
                value={senha}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
                placeholder="Sua senha"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-12 pr-4 text-white outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {erro && (
            <div className="rounded-xl border border-rose-800 bg-rose-950/50 p-4 text-sm font-semibold text-rose-300">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3.5 font-bold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Verificando...
              </>
            ) : (
              <>
                <Lock size={17} />
                Entrar no painel
              </>
            )}
          </button>
        </form>

        <div className="mt-7 border-t border-slate-800 pt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-semibold text-teal-400 hover:text-teal-300"
          >
            Voltar para acesso do cidadão
          </Link>
        </div>

      </div>
    </div>
  );
}