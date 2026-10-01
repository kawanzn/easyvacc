import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

const somenteDigitos = (valor: unknown) =>
  String(valor ?? '').replace(/\D/g, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return responder(
      {
        sucesso: false,
        codigo: 'METODO_INVALIDO',
        mensagem: 'Método não permitido.',
      },
      405
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get(
      'SUPABASE_SERVICE_ROLE_KEY'
    );

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error(
        'Variáveis obrigatórias do Supabase não configuradas.'
      );

      return responder(
        {
          sucesso: false,
          codigo: 'CONFIGURACAO',
          mensagem:
            'O serviço de cadastro está temporariamente indisponível.',
        },
        500
      );
    }

    let body: {
      nome?: string;
      cpf?: string;
      cns?: string | null;
      email?: string;
      cidade?: string;
      data_nascimento?: string | null;
      senha?: string;
      termos_versao?: string;
      privacidade_versao?: string;
    };

    try {
      body = await req.json();
    } catch {
      return responder(
        {
          sucesso: false,
          codigo: 'REQUISICAO_INVALIDA',
          mensagem:
            'Não foi possível interpretar os dados enviados.',
        },
        400
      );
    }

    const nome = String(body.nome ?? '').trim();
    const cpf = somenteDigitos(body.cpf);
    const cns = somenteDigitos(body.cns);
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const cidade = String(body.cidade ?? '').trim();
    const dataNascimento =
      body.data_nascimento
        ? String(body.data_nascimento)
        : null;
    const senha = String(body.senha ?? '');

    if (!nome) {
      return responder(
        {
          sucesso: false,
          codigo: 'NOME_OBRIGATORIO',
          mensagem: 'Informe seu nome completo.',
        },
        400
      );
    }

    if (cpf.length !== 11) {
      return responder(
        {
          sucesso: false,
          codigo: 'CPF_INVALIDO',
          mensagem:
            'O CPF informado é inválido. Confira os 11 dígitos.',
        },
        400
      );
    }

    if (cns && cns.length !== 15) {
      return responder(
        {
          sucesso: false,
          codigo: 'CNS_INVALIDO',
          mensagem:
            'O Cartão Nacional de Saúde (CNS) informado é inválido. Confira os 15 dígitos.',
        },
        400
      );
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return responder(
        {
          sucesso: false,
          codigo: 'EMAIL_INVALIDO',
          mensagem:
            'O e-mail informado é inválido. Confira o endereço digitado.',
        },
        400
      );
    }

    if (!cidade) {
      return responder(
        {
          sucesso: false,
          codigo: 'CIDADE_OBRIGATORIA',
          mensagem: 'Informe sua cidade.',
        },
        400
      );
    }

    if (senha.length < 8) {
      return responder(
        {
          sucesso: false,
          codigo: 'SENHA_INVALIDA',
          mensagem:
            'A senha deve ter no mínimo 8 caracteres.',
        },
        400
      );
    }

    const admin = createClient(
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
     * CPF
     */
    const {
      data: cpfExistente,
      error: erroCpf,
    } = await admin
      .from('users')
      .select('id')
      .eq('cpf', cpf)
      .maybeSingle();

    if (erroCpf) {
      console.error('Erro ao verificar CPF:', erroCpf);

      return responder(
        {
          sucesso: false,
          codigo: 'ERRO_VERIFICAR_CPF',
          mensagem:
            'Não foi possível verificar o CPF neste momento. Tente novamente.',
        },
        500
      );
    }

    if (cpfExistente) {
      return responder(
        {
          sucesso: false,
          codigo: 'CPF_EXISTENTE',
          mensagem:
            'Este CPF já está cadastrado no EasyVacc.',
        },
        409
      );
    }

    /*
     * CNS
     */
    if (cns) {
      const {
        data: cnsUsuario,
        error: erroCnsUsuario,
      } = await admin
        .from('users')
        .select('id')
        .eq('cns', cns)
        .maybeSingle();

      if (erroCnsUsuario) {
        console.error(
          'Erro ao verificar CNS em users:',
          erroCnsUsuario
        );

        return responder(
          {
            sucesso: false,
            codigo: 'ERRO_VERIFICAR_CNS',
            mensagem:
              'Não foi possível verificar o Cartão SUS neste momento. Tente novamente.',
          },
          500
        );
      }

      const {
        data: cnsDependente,
        error: erroCnsDependente,
      } = await admin
        .from('dependentes')
        .select('id')
        .eq('cns', cns)
        .maybeSingle();

      if (erroCnsDependente) {
        console.error(
          'Erro ao verificar CNS em dependentes:',
          erroCnsDependente
        );

        return responder(
          {
            sucesso: false,
            codigo: 'ERRO_VERIFICAR_CNS',
            mensagem:
              'Não foi possível verificar o Cartão SUS neste momento. Tente novamente.',
          },
          500
        );
      }

      if (cnsUsuario || cnsDependente) {
        return responder(
          {
            sucesso: false,
            codigo: 'CNS_EXISTENTE',
            mensagem:
              'Este Cartão Nacional de Saúde (CNS) já está vinculado a outro cadastro.',
          },
          409
        );
      }
    }

    /*
     * Verifica e-mail no Auth sem expor essa informação
     * para consultas diretas do navegador.
     */
    const {
      data: usuariosAuth,
      error: erroListarAuth,
    } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (erroListarAuth) {
      console.error(
        'Erro ao verificar e-mail:',
        erroListarAuth
      );

      return responder(
        {
          sucesso: false,
          codigo: 'ERRO_VERIFICAR_EMAIL',
          mensagem:
            'Não foi possível verificar o e-mail neste momento. Tente novamente.',
        },
        500
      );
    }

    const emailExistente =
      usuariosAuth.users.some(
        (usuario) =>
          usuario.email?.toLowerCase() === email
      );

    if (emailExistente) {
      return responder(
        {
          sucesso: false,
          codigo: 'EMAIL_EXISTENTE',
          mensagem:
            'Este e-mail já está cadastrado no EasyVacc. Tente entrar na sua conta ou recuperar sua senha.',
        },
        409
      );
    }

    /*
     * Criamos o usuário usando o fluxo normal de signup,
     * preservando a confirmação de e-mail.
     */
    const auth = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: authData,
      error: authError,
    } = await auth.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
        },
      },
    });

    if (authError || !authData.user) {
      console.error(
        'Erro ao criar usuário no Auth:',
        authError
      );

      const mensagem =
        authError?.message?.toLowerCase() ?? '';

      if (
        mensagem.includes('already registered') ||
        mensagem.includes('already been registered')
      ) {
        return responder(
          {
            sucesso: false,
            codigo: 'EMAIL_EXISTENTE',
            mensagem:
              'Este e-mail já está cadastrado no EasyVacc.',
          },
          409
        );
      }

      if (
        mensagem.includes('rate limit') ||
        authError?.status === 429
      ) {
        return responder(
          {
            sucesso: false,
            codigo: 'LIMITE_EMAIL',
            mensagem:
              'Muitas tentativas de cadastro foram realizadas. Aguarde alguns minutos e tente novamente.',
          },
          429
        );
      }

      return responder(
        {
          sucesso: false,
          codigo: 'ERRO_AUTH',
          mensagem:
            'Não foi possível criar sua conta de acesso. Tente novamente.',
        },
        400
      );
    }

    const agora = new Date().toISOString();

    /*
     * O perfil é gravado pelo backend com service role.
     * A RLS da tabela users continua protegida.
     */
    const { error: profileError } = await admin
      .from('users')
      .insert({
        id: authData.user.id,
        nome,
        cpf,
        cns: cns || null,
        email,
        cidade,
        data_nascimento: dataNascimento,
        termos_aceitos_em: agora,
        privacidade_aceita_em: agora,
        termos_versao:
          String(body.termos_versao ?? ''),
        privacidade_versao:
          String(body.privacidade_versao ?? ''),
      });

    if (profileError) {
      console.error(
        'Erro ao criar perfil:',
        profileError
      );

      /*
       * Evita deixar uma conta incompleta no Auth
       * caso o perfil não consiga ser criado.
       */
      await admin.auth.admin.deleteUser(
        authData.user.id
      );

      const texto = [
        profileError.message,
        profileError.details,
        profileError.hint,
        profileError.code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (texto.includes('cpf')) {
        return responder(
          {
            sucesso: false,
            codigo: 'CPF_EXISTENTE',
            mensagem:
              'Este CPF já está cadastrado no EasyVacc.',
          },
          409
        );
      }

      if (texto.includes('cns')) {
        return responder(
          {
            sucesso: false,
            codigo: 'CNS_INVALIDO_OU_EXISTENTE',
            mensagem:
              'Não foi possível cadastrar o Cartão SUS (CNS). Confira o número informado.',
          },
          400
        );
      }

      if (texto.includes('email')) {
        return responder(
          {
            sucesso: false,
            codigo: 'EMAIL_EXISTENTE',
            mensagem:
              'Este e-mail já está cadastrado no EasyVacc.',
          },
          409
        );
      }

      return responder(
        {
          sucesso: false,
          codigo: 'ERRO_PERFIL',
          mensagem:
            'A conta de acesso não foi mantida porque não foi possível salvar os dados do perfil. Confira os dados e tente novamente.',
        },
        400
      );
    }

    return responder(
      {
        sucesso: true,
        mensagem:
          'Cadastro realizado com sucesso. Verifique seu e-mail para confirmar sua conta.',
        email,
      },
      201
    );
  } catch (error) {
    console.error(
      'Erro inesperado no cadastro:',
      error
    );

    return responder(
      {
        sucesso: false,
        codigo: 'ERRO_INTERNO',
        mensagem:
          'Ocorreu um erro inesperado durante o cadastro. Tente novamente em alguns instantes.',
      },
      500
    );
  }
});