import { useEffect, useState } from 'react';
import {
  Navigate,
  useLocation,
} from 'react-router-dom';
import {
  Loader2,
  ShieldCheck,
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-400">
            <ShieldCheck size={27} />
          </div>

          <Loader2
            className="mx-auto animate-spin text-teal-400"
            size={24}
          />

          <p className="mt-4 text-sm text-slate-400">
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