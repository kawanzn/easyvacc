import { createClient } from 'npm:@supabase/supabase-js@2';

const UBS_URL =
  'https://apidadosabertos.saude.gov.br/assistencia-a-saude/unidade-basicas-de-saude';

const MUNICIPIOS_POR_EXECUCAO = 3;
const LIMITE_POR_PAGINA = 500;

type MunicipioFila = {
  id: number;
  codigo_ibge: string;
  municipio: string;
  uf: string;
  tentativas: number;
};

type UnidadeUBS = {
  ibge?: string | number;
  bairro?: string | null;
  logradouro?: string | null;
  cnes?: string | number;
  uf?: string | number;
  latitude?: string | number | null;
  longitude?: string | number | null;
  nome?: string | null;
};

function resposta(dados: unknown, status = 200) {
  return new Response(JSON.stringify(dados, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type, x-cron-secret',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

function texto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const resultado = String(valor).trim();
  return resultado.length > 0 ? resultado : null;
}

function coordenada(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null;

  const numero =
    typeof valor === 'number'
      ? valor
      : Number(String(valor).trim().replace(',', '.'));

  return Number.isFinite(numero) ? numero : null;
}

function codigoIBGE(valor: unknown): string {
  return String(valor ?? '').trim();
}

function codigoCNES(valor: unknown): string {
  return String(valor ?? '').trim();
}

async function buscarUBSDosMunicipios(
  codigosDesejados: Set<string>,
): Promise<{
  unidadesPorMunicipio: Map<string, UnidadeUBS[]>;
  totalLido: number;
  paginas: number;
  coletaCompleta: boolean;
}> {
  const unidadesPorMunicipio = new Map<string, UnidadeUBS[]>();

  for (const codigo of codigosDesejados) {
    unidadesPorMunicipio.set(codigo, []);
  }

  let offset = 0;
  let totalLido = 0;
  let paginas = 0;
  let coletaCompleta = false;

  while (true) {
    const url =
      `${UBS_URL}?limit=${LIMITE_POR_PAGINA}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'EasyVacc/1.0 - Sincronizacao UBS',
      },
    });

    if (!response.ok) {
      throw new Error(
        `API de UBS respondeu HTTP ${response.status} na página ${paginas + 1}.`,
      );
    }

    const dados = await response.json();

    const pagina: UnidadeUBS[] =
      Array.isArray(dados?.ubs) ? dados.ubs : [];

    paginas += 1;
    totalLido += pagina.length;

    for (const unidade of pagina) {
      const ibge = codigoIBGE(unidade.ibge);

      if (!codigosDesejados.has(ibge)) {
        continue;
      }

      const lista = unidadesPorMunicipio.get(ibge);

      if (lista) {
        lista.push(unidade);
      }
    }

    // Página vazia: chegamos inequivocamente ao fim da base.
    if (pagina.length === 0) {
      coletaCompleta = true;
      break;
    }

    // Se a API devolveu menos que o limite solicitado, esta foi a última página.
    if (pagina.length < LIMITE_POR_PAGINA) {
      coletaCompleta = true;
      break;
    }

    offset += pagina.length;

    // Proteção contra uma API que eventualmente ignore o offset.
    if (paginas > 1000) {
      throw new Error(
        'A paginação da API de UBS excedeu o limite de segurança.',
      );
    }
  }

  return {
    unidadesPorMunicipio,
    totalLido,
    paginas,
    coletaCompleta,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return resposta({ sucesso: true });
  }

  if (req.method !== 'POST') {
    return resposta(
      {
        sucesso: false,
        erro: 'Método não permitido.',
      },
      405,
    );
  }

  try {
    const cronSecret = Deno.env.get('POSTOS_CRON_SECRET');

    if (!cronSecret) {
      console.error('POSTOS_CRON_SECRET não configurado.');

      return resposta(
        {
          sucesso: false,
          erro: 'Configuração interna de segurança ausente.',
        },
        500,
      );
    }

    const secretRecebido = req.headers.get('x-cron-secret');

    if (!secretRecebido || secretRecebido !== cronSecret) {
      console.warn('Tentativa de acesso sem x-cron-secret válido.');

      return resposta(
        {
          sucesso: false,
          erro: 'Não autorizado.',
        },
        401,
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Variáveis do Supabase não configuradas.');
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    const {
      data: municipios,
      error: erroMunicipios,
    } = await supabase
      .from('sincronizacao_postos')
      .select(`
        id,
        codigo_ibge,
        municipio,
        uf,
        tentativas
      `)
      .eq('sincronizado', false)
      .lt('tentativas', 5)
      .order('tentativas', { ascending: true })
      .order('id', { ascending: true })
      .limit(MUNICIPIOS_POR_EXECUCAO);

    if (erroMunicipios) {
      throw new Error(
        `Erro ao consultar fila: ${erroMunicipios.message}`,
      );
    }

    const fila = (municipios ?? []) as MunicipioFila[];

    if (fila.length === 0) {
      return resposta({
        sucesso: true,
        concluido: true,
        processados: 0,
        mensagem: 'Nenhum município pendente encontrado.',
      });
    }

    const codigosDesejados = new Set(
      fila.map((municipio) =>
        String(municipio.codigo_ibge).trim()
      ),
    );

    /*
     * A API oficial de UBS não respeitou os filtros por município nos testes.
     * Por isso percorremos a fonte paginada UMA VEZ por execução e separamos
     * apenas os municípios que estão na fila desta execução.
     */
    const coleta = await buscarUBSDosMunicipios(
      codigosDesejados,
    );

    if (!coleta.coletaCompleta) {
      throw new Error(
        'A coleta da API de UBS não foi concluída. Nenhum posto antigo será desativado.',
      );
    }

    console.log(
      `Coleta UBS concluída: ${coleta.totalLido} registros lidos em ${coleta.paginas} páginas.`,
    );

    const resultados: unknown[] = [];

    for (const municipio of fila) {
      const agora = new Date().toISOString();
      const codigo = String(municipio.codigo_ibge).trim();

      try {
        console.log(
          `Sincronizando ${municipio.municipio}/${municipio.uf} - ${codigo}`,
        );

        const unidades =
          coleta.unidadesPorMunicipio.get(codigo) ?? [];

        const registros = unidades
          .map((item) => {
            const cnes = codigoCNES(item.cnes);
            const nome = texto(item.nome);

            if (!cnes || !nome) {
              return null;
            }

            return {
              cnes,
              codigo_ibge: codigo,
              nome,
              nome_empresarial: null,
              tipo: 'UNIDADE BASICA DE SAUDE',
              classificacao: 'UNIDADE BASICA DE SAUDE',
              gestao: null,
              grupo_natureza: null,
              publico: false,
              logradouro: texto(item.logradouro),
              numero: null,
              complemento: texto(item.bairro),
              cep: null,
              telefone: null,
              email: null,
              latitude: coordenada(item.latitude),
              longitude: coordenada(item.longitude),
              status: 'ATIVO',
              competencia: null,
              ativo: true,
              updated_at: agora,
              sincronizado_em: agora,
            };
          })
          .filter(
            (registro): registro is NonNullable<typeof registro> =>
              registro !== null,
          );

        const registrosUnicos = Array.from(
          new Map(
            registros.map((registro) => [
              registro.cnes,
              registro,
            ]),
          ).values(),
        );

        const duplicadosRemovidos =
          registros.length - registrosUnicos.length;

        console.log(
          `${municipio.municipio}: ` +
            `${unidades.length} UBS encontradas na fonte, ` +
            `${registrosUnicos.length} CNES únicos.`,
        );

        /*
         * Proteção importante:
         * se a fonte completa não trouxer nenhuma UBS para o município,
         * NÃO desativamos os dados antigos automaticamente.
         */
        if (registrosUnicos.length === 0) {
          throw new Error(
            'Nenhuma UBS foi encontrada na fonte oficial para este município. Dados anteriores foram preservados.',
          );
        }

        const { error: erroSalvar } = await supabase
          .from('postos_saude')
          .upsert(registrosUnicos, {
            onConflict: 'cnes',
          });

        if (erroSalvar) {
          throw new Error(
            `Erro ao salvar postos: ${erroSalvar.message}`,
          );
        }

        /*
         * Só chegamos aqui após:
         * 1) percorrer toda a paginação;
         * 2) encontrar pelo menos uma UBS para o município;
         * 3) salvar com sucesso os registros atuais.
         *
         * Portanto agora é seguro comparar os CNES atuais com os antigos.
         */
        const cnesAtuais = registrosUnicos.map(
          (registro) => registro.cnes,
        );

        const {
          data: postosExistentes,
          error: erroExistentes,
        } = await supabase
          .from('postos_saude')
          .select('id,cnes')
          .eq('codigo_ibge', codigo)
          .eq('ativo', true);

        if (erroExistentes) {
          throw new Error(
            `Erro ao verificar postos existentes: ${erroExistentes.message}`,
          );
        }

        const idsDesativar = (postosExistentes ?? [])
          .filter(
            (posto) =>
              !cnesAtuais.includes(String(posto.cnes)),
          )
          .map((posto) => posto.id);

        if (idsDesativar.length > 0) {
          const { error: erroDesativar } = await supabase
            .from('postos_saude')
            .update({
              ativo: false,
              updated_at: agora,
            })
            .in('id', idsDesativar);

          if (erroDesativar) {
            throw new Error(
              `Erro ao desativar postos antigos: ${erroDesativar.message}`,
            );
          }
        }

        const {
          error: erroAtualizarFila,
        } = await supabase
          .from('sincronizacao_postos')
          .update({
            sincronizado: true,
            ultima_sincronizacao: agora,
            total_postos: registrosUnicos.length,
            ultimo_erro: null,
            updated_at: agora,
          })
          .eq('id', municipio.id);

        if (erroAtualizarFila) {
          throw new Error(
            `Erro ao atualizar fila: ${erroAtualizarFila.message}`,
          );
        }

        resultados.push({
          codigo_ibge: codigo,
          municipio: municipio.municipio,
          uf: municipio.uf,
          unidadesEncontradas: unidades.length,
          duplicadosRemovidos,
          postosSalvos: registrosUnicos.length,
          postosDesativados: idsDesativar.length,
          sucesso: true,
        });

        console.log(
          `${municipio.municipio}: ${registrosUnicos.length} UBS sincronizadas.`,
        );
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : 'Erro desconhecido';

        console.error(
          `Erro em ${municipio.municipio}:`,
          mensagem,
        );

        const { error: erroRegistrarFalha } = await supabase
          .from('sincronizacao_postos')
          .update({
            tentativas: (municipio.tentativas ?? 0) + 1,
            ultimo_erro: mensagem,
            updated_at: agora,
          })
          .eq('id', municipio.id);

        if (erroRegistrarFalha) {
          console.error(
            'Erro ao registrar falha:',
            erroRegistrarFalha.message,
          );
        }

        resultados.push({
          codigo_ibge: codigo,
          municipio: municipio.municipio,
          uf: municipio.uf,
          sucesso: false,
          erro: mensagem,
        });
      }
    }

    const {
      count: pendentes,
      error: erroPendentes,
    } = await supabase
      .from('sincronizacao_postos')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('sincronizado', false)
      .lt('tentativas', 5);

    if (erroPendentes) {
      console.error(
        'Erro ao contar pendentes:',
        erroPendentes.message,
      );
    }

    return resposta({
      sucesso: true,
      fonte:
        'Ministério da Saúde - Unidades Básicas de Saúde / CNES',
      coletaCompleta: coleta.coletaCompleta,
      totalLidoFonte: coleta.totalLido,
      paginasLidas: coleta.paginas,
      concluido: (pendentes ?? 0) === 0,
      processados: fila.length,
      pendentes: pendentes ?? 0,
      resultados,
    });
  } catch (error) {
    console.error('Erro geral:', error);

    return resposta(
      {
        sucesso: false,
        erro:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido.',
      },
      500,
    );
  }
});
