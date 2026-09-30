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

export default function RotaAdministrador({
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

        const {
          data: ehAdmin,
          error: adminError,
        } = await supabase.rpc(
          'eh_administrador'
        );

        if (adminError || ehAdmin !== true) {
          if (adminError) {
            console.error(
              'Erro ao verificar administrador:',
              adminError
            );
          }

          if (ativo) {
            setStatus('nao-autorizado');
          }
          return;
        }

        if (ativo) {
          setStatus('autorizado');
        }
      } catch (error) {
        console.error(
          'Erro ao validar acesso administrativo:',
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
            Verificando acesso administrativo...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'nao-autorizado') {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <>{children}</>;
}