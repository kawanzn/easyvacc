
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function RotaProtegida() {
  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    let ativo = true;
    let versaoVerificacao = 0;

    const verificarUsuario = async () => {
      const versaoAtual = ++versaoVerificacao;

      if (ativo) {
        setCarregando(true);
        setAutorizado(false);
      }

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (ativo && versaoAtual === versaoVerificacao) {
            setAutorizado(false);
          }
          return;
        }

        // Confirma que a conta autenticada pertence
        // a um cidadão cadastrado no EasyVacc.
        const { data: cidadao, error: perfilError } =
          await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (ativo && versaoAtual === versaoVerificacao) {
          setAutorizado(
            !perfilError &&
            cidadao?.id === user.id
          );
        }
      } catch (error) {
        console.error(
          'Erro ao verificar acesso do cidadão:',
          error
        );

        if (ativo && versaoAtual === versaoVerificacao) {
          setAutorizado(false);
        }
      } finally {
        if (ativo && versaoAtual === versaoVerificacao) {
          setCarregando(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (!ativo) return;

      // Revalida o acesso quando a sessão muda.
      // O adiamento evita chamadas Supabase
      // diretamente dentro do callback de autenticação.
      setTimeout(() => {
        if (ativo) {
          void verificarUsuario();
        }
      }, 0);
    });

    void verificarUsuario();

    return () => {
      ativo = false;
      versaoVerificacao++;
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

  if (!autorizado) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
