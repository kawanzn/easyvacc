import { useEffect, useState } from 'react';
import {
  Navigate,
  useLocation,
} from 'react-router-dom';
import {
  Loader2,
  ShieldCheck,
  Moon,
  Sun,
} from 'lucide-react';

import { supabase } from '../services/supabase';

type Status =
  | 'carregando'
  | 'autorizado'
  | 'nao-autorizado';

export default function RotaProfissional({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  const [temaClaro, setTemaClaro] = useState(
    () => localStorage.getItem('easyvacc-tema') === 'claro'
  );

  const alternarTema = () => {
    setTemaClaro((atual) => {
      const novoTemaClaro = !atual;
      localStorage.setItem(
        'easyvacc-tema',
        novoTemaClaro ? 'claro' : 'escuro'
      );
      return novoTemaClaro;
    });
  };

  const [status, setStatus] =
    useState<Status>('carregando');

  useEffect(() => {
    let ativo = true;

    const verificarAcesso = async () => {
      try {
        // ==========================================
        // 1. VERIFICAR SESSÃO
        // ==========================================

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (ativo) {
            setStatus('nao-autorizado');
          }

          return;
        }

        // ==========================================
        // 2. VERIFICAR PROFISSIONAL
        // ==========================================

        const {
          data: profissional,
          error: profissionalError,
        } = await supabase
          .from('profissionais')
          .select('id, ativo')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        if (
          profissionalError ||
          !profissional
        ) {
          if (profissionalError) {
            console.error(
              'Erro ao verificar profissional:',
              profissionalError
            );
          }

          if (ativo) {
            setStatus('nao-autorizado');
          }

          return;
        }

        // ==========================================
        // 3. AUTORIZADO
        // ==========================================

        if (ativo) {
          setStatus('autorizado');
        }
      } catch (error) {
        console.error(
          'Erro ao validar acesso profissional:',
          error
        );

        if (ativo) {
          setStatus('nao-autorizado');
        }
      }
    };

    void verificarAcesso();

    return () => {
      ativo = false;
    };
  }, []);

  // ==========================================
  // CARREGANDO
  // ==========================================

  if (status === 'carregando') {
    return (
      <div
        className={`relative flex min-h-screen items-center justify-center ${
          temaClaro
            ? 'bg-slate-50 text-slate-950'
            : 'bg-slate-950 text-slate-100'
        }`}
      >
        <button
          type="button"
          onClick={alternarTema}
          aria-label={temaClaro ? 'Ativar tema escuro' : 'Ativar tema claro'}
          title={temaClaro ? 'Tema escuro' : 'Tema claro'}
          className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition ${
            temaClaro
              ? 'border-slate-300 bg-white text-slate-700 hover:border-teal-500 hover:text-teal-600'
              : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-teal-500 hover:text-teal-400'
          }`}
        >
          {temaClaro ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-400">
            <ShieldCheck size={27} />
          </div>

          <Loader2
            className="mx-auto animate-spin text-teal-400"
            size={24}
          />

          <p className={`mt-4 text-sm ${temaClaro ? 'text-slate-600' : 'text-slate-400'}`}>
            Verificando autorização...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // NÃO AUTORIZADO
  // ==========================================

  if (status === 'nao-autorizado') {
    return (
      <Navigate
        to="/profissional/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  // ==========================================
  // AUTORIZADO
  // ==========================================

  return <>{children}</>;
}