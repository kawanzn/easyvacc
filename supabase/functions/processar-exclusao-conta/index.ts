import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  const responder = (
    body: Record<string, unknown>,
    status = 200
  ) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });

  try {
    if (req.method !== 'POST') {
      return responder(
        { sucesso: false, erro: 'Método não permitido.' },
        405
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get(
      'SUPABASE_SERVICE_ROLE_KEY'
    );

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error(
        'Variáveis de ambiente obrigatórias não configuradas.'
      );

      return responder(
        {
          sucesso: false,
          erro: 'Configuração interna indisponível.',
        },
        500
      );
    }

    const authorization =
      req.headers.get('Authorization');

    if (!authorization) {
      return responder(
        {
          sucesso: false,
          erro: 'Usuário não autenticado.',
        },
        401
      );
    }

    /*
     * Cliente que representa quem chamou a função.
     * Ele é usado somente para validar a identidade.
     */
    const supabaseUsuario = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUsuario.auth.getUser();

    if (userError || !user) {
      console.error(
        'Falha ao validar usuário:',
        userError
      );

      return responder(
        {
          sucesso: false,
          erro: 'Sessão inválida ou expirada.',
        },
        401
      );
    }

    /*
     * Cliente administrativo.
     * A service role existe somente dentro da Edge Function.
     */
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /*
     * Confirma diretamente no banco se o usuário autenticado
     * é um administrador ativo.
     */
    const {
      data: administrador,
      error: adminError,
    } = await supabaseAdmin
      .from('administradores')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .maybeSingle();

    if (adminError) {
      console.error(
        'Erro ao verificar administrador:',
        adminError
      );

      return responder(
        {
          sucesso: false,
          erro: 'Não foi possível validar o administrador.',
        },
        500
      );
    }

    if (!administrador) {
      return responder(
        {
          sucesso: false,
          erro: 'Acesso não autorizado.',
        },
        403
      );
    }

    let body: {
      solicitacao_id?: number;
    };

    try {
      body = await req.json();
    } catch {
      return responder(
        {
          sucesso: false,
          erro: 'Requisição inválida.',
        },
        400
      );
    }

    const solicitacaoId = Number(
      body.solicitacao_id
    );

    if (
      !Number.isInteger(solicitacaoId) ||
      solicitacaoId <= 0
    ) {
      return responder(
        {
          sucesso: false,
          erro: 'Solicitação inválida.',
        },
        400
      );
    }

    /*
     * Localiza somente uma solicitação que ainda pode
     * ser processada.
     */
    const {
      data: solicitacao,
      error: solicitacaoError,
    } = await supabaseAdmin
      .from('solicitacoes_exclusao')
      .select('id, usuario_id, status')
      .eq('id', solicitacaoId)
      .in('status', ['pendente', 'em_analise'])
      .maybeSingle();

    if (solicitacaoError) {
      console.error(
        'Erro ao consultar solicitação:',
        solicitacaoError
      );

      return responder(
        {
          sucesso: false,
          erro: 'Não foi possível consultar a solicitação.',
        },
        500
      );
    }

    if (!solicitacao) {
      return responder(
        {
          sucesso: false,
          erro:
            'Solicitação não encontrada ou já processada.',
        },
        404
      );
    }

    /*
     * Não permite que um administrador exclua a própria
     * conta através deste fluxo.
     */
    if (solicitacao.usuario_id === user.id) {
      return responder(
        {
          sucesso: false,
          erro:
            'O administrador não pode excluir a própria conta por este fluxo.',
        },
        400
      );
    }

    /*
     * Primeiro marcamos a solicitação como em análise.
     */
    const { error: analiseError } =
      await supabaseAdmin
        .from('solicitacoes_exclusao')
        .update({
          status: 'em_analise',
          atualizado_em:
            new Date().toISOString(),
        })
        .eq('id', solicitacao.id);

    if (analiseError) {
      console.error(
        'Erro ao atualizar solicitação:',
        analiseError
      );

      return responder(
        {
          sucesso: false,
          erro:
            'Não foi possível iniciar o processamento da solicitação.',
        },
        500
      );
    }

    /*
     * Exclui a identidade do Supabase Auth.
     *
     * As tabelas relacionadas devem respeitar as regras
     * de integridade configuradas no banco.
     */
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(
        solicitacao.usuario_id
      );

    if (deleteError) {
      console.error(
        'Erro ao excluir usuário:',
        deleteError
      );

      /*
       * Se a exclusão falhar, devolvemos a solicitação
       * para pendente para permitir nova tentativa.
       */
      await supabaseAdmin
        .from('solicitacoes_exclusao')
        .update({
          status: 'pendente',
          atualizado_em:
            new Date().toISOString(),
        })
        .eq('id', solicitacao.id);

      return responder(
        {
          sucesso: false,
          erro:
            'Não foi possível excluir a conta. A solicitação continua pendente.',
        },
        500
      );
    }

    /*
     * Se a tabela de solicitações sobreviver à exclusão
     * do usuário, registramos a conclusão.
     *
     * Caso exista ON DELETE CASCADE em usuario_id,
     * a solicitação poderá já ter sido removida.
     */
    await supabaseAdmin
      .from('solicitacoes_exclusao')
      .update({
        status: 'concluida',
        atualizado_em:
          new Date().toISOString(),
      })
      .eq('id', solicitacao.id);

    console.log(
      `Solicitação ${solicitacao.id} processada pelo administrador ${user.id}.`
    );

    return responder({
      sucesso: true,
      mensagem:
        'Solicitação de exclusão processada com sucesso.',
    });
  } catch (error) {
    console.error(
      'Erro inesperado ao processar exclusão:',
      error
    );

    return new Response(
      JSON.stringify({
        sucesso: false,
        erro:
          'Ocorreu um erro interno ao processar a exclusão.',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
});