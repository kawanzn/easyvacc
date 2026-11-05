import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function RotaProtegida() {
  const [carregando, setCarregando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    let ativo = true;

    const verificarUsuario = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!ativo) return;

        setAutenticado(!error && !!user);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);

        if (ativo) {
          setAutenticado(false);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    };

    void verificarUsuario();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ativo) return;

      setAutenticado(!!session?.user);
      setCarregando(false);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">
          Verificando sessão...
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}