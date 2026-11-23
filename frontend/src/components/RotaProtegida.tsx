import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../services/supabase';

type EstadoAcesso = 'verificando' | 'autorizado' | 'negado';

export default function RotaProtegida() {
  const [estadoAcesso, setEstadoAcesso] = useState<EstadoAcesso>('verificando');

  useEffect(() => {
    let ativo = true;
    let versaoVerificacao = 0;
    let usuarioValidadoId: string | null = null;

    const verificarUsuario = async () => {
      const versaoAtual = ++versaoVerificacao;

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!ativo || versaoAtual !== versaoVerificacao) return;

        if (authError || !user) {
          usuarioValidadoId = null;
          setEstadoAcesso('negado');
          return;
        }

        // Somente cidadãos cadastrados podem acessar estas rotas.
        const { data: cidadao, error: perfilError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!ativo || versaoAtual !== versaoVerificacao) return;

        const permitido = !perfilError && cidadao?.id === user.id;
        usuarioValidadoId = permitido ? user.id : null;
        setEstadoAcesso(permitido ? 'autorizado' : 'negado');
      } catch (error) {
        console.error('Erro ao verificar acesso do cidadão:', error);
        if (ativo && versaoAtual === versaoVerificacao) {
          usuarioValidadoId = null;
          setEstadoAcesso('negado');
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (evento, sessao) => {
        if (!ativo) return;

        if (evento === 'SIGNED_OUT') {
          // Invalida qualquer verificação anterior e bloqueia o acesso imediatamente.
          versaoVerificacao++;
          usuarioValidadoId = null;
          setEstadoAcesso('negado');
          return;
        }

        if (evento === 'SIGNED_IN' || evento === 'USER_UPDATED') {
          const novoUsuarioId = sessao?.user?.id ?? null;

          // O Supabase também emite SIGNED_IN ao recuperar o foco da aba.
          // Se o cidadão é o mesmo, não desmontamos a página.
          if (novoUsuarioId && novoUsuarioId === usuarioValidadoId) return;

          // Se a conta mudou, escondemos a área anterior até validar a nova.
          versaoVerificacao++;
          usuarioValidadoId = null;
          setEstadoAcesso('verificando');
          setTimeout(() => {
            if (ativo) void verificarUsuario();
          }, 0);
        }

        // INITIAL_SESSION e TOKEN_REFRESHED não exigem remontar a interface.
      }
    );

    void verificarUsuario();

    return () => {
      ativo = false;
      versaoVerificacao++;
      subscription.unsubscribe();
    };
  }, []);

  if (estadoAcesso === 'verificando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Preparando seu acesso...</div>
      </div>
    );
  }

  if (estadoAcesso === 'negado') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
