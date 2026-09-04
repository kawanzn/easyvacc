import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

type Request = { method?: string; url?: string; query: Record<string, string | string[]>; body?: Record<string, unknown> };
type Response = { status: (code: number) => Response; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

const ok = (res: Response, dados: unknown, status = 200) => res.status(status).json(dados);
const value = (body: Record<string, unknown>, key: string) => String(body[key] ?? '').trim();
const userDto = (u: Record<string, unknown>) => ({ id: u.id, nome: u.nome, cpf: u.cpf, cns: u.cns, email: u.email, cidade: u.cidade, telefone: u.telefone, dataNascimento: u.data_nascimento, endereco: u.endereco, tipoSanguineo: u.tipo_sanguineo, alergias: u.alergias, contatoEmergencia: u.contato_emergencia, telefoneEmergencia: u.telefone_emergencia });

export default async function handler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return ok(res, { sucesso: false, mensagem: 'DATABASE_URL não configurada na Vercel.' }, 500);

  const sql = neon(databaseUrl);
  const requestPath = req.url ? new URL(req.url, 'http://localhost').pathname : '';
  const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path || requestPath);
  const path = rawPath.replace(/^api\//, '').replace(/^\/+|\/+$/g, '');
  const body = req.body || {};

  try {
    if (req.method === 'GET' && path === 'health') {
      await sql.query('select 1');
      return ok(res, { sucesso: true, status: 'ok', mensagem: 'API EasyVacc funcionando.' });
    }

    if (req.method === 'POST' && path === 'usuarios/cadastro') {
      const nome = value(body, 'nome'), cpf = value(body, 'cpf'), cns = value(body, 'cns');
      const email = value(body, 'email').toLowerCase(), cidade = value(body, 'cidade'), senha = value(body, 'senha');
      if (!nome) return ok(res, { sucesso: false, mensagem: 'Informe o nome completo.' }, 422);
      if (!/^\d{11}$/.test(cpf)) return ok(res, { sucesso: false, mensagem: 'O CPF deve conter exatamente 11 números.' }, 422);
      if (!/^\d{15}$/.test(cns)) return ok(res, { sucesso: false, mensagem: 'O CNS deve conter exatamente 15 números.' }, 422);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ok(res, { sucesso: false, mensagem: 'Informe um e-mail válido.' }, 422);
      if (!cidade) return ok(res, { sucesso: false, mensagem: 'Informe a cidade.' }, 422);
      if (senha.length < 6) return ok(res, { sucesso: false, mensagem: 'A senha deve ter pelo menos 6 caracteres.' }, 422);
      const hash = await bcrypt.hash(senha, 12);
      const rows = await sql.query('insert into users (nome, cpf, cns, email, cidade, senha, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,now(),now()) returning *', [nome, cpf, cns, email, cidade, hash]);
      return ok(res, { sucesso: true, mensagem: 'Usuário cadastrado com sucesso.', dados: userDto(rows[0]) }, 201);
    }

    if (req.method === 'POST' && path === 'usuarios/login') {
      const rows = await sql.query('select * from users where cpf = $1 limit 1', [value(body, 'cpf')]);
      const usuario = rows[0] as Record<string, unknown> | undefined;
      const hash = String(usuario?.senha || '').replace(/^\$2y\$/, '$2b$');
      if (!usuario || !(await bcrypt.compare(value(body, 'senha'), hash))) return ok(res, { sucesso: false, mensagem: 'CPF ou senha incorretos.' }, 401);
      return ok(res, { sucesso: true, mensagem: 'Login efetuado.', dados: userDto(usuario) });
    }

    let match = path.match(/^usuarios\/cpf\/(\d{11})$/);
    if (req.method === 'GET' && match) {
      const rows = await sql.query('select * from users where cpf = $1 limit 1', [match[1]]);
      return rows[0] ? ok(res, { sucesso: true, dados: userDto(rows[0]) }) : ok(res, { sucesso: false, mensagem: 'Usuário não encontrado.' }, 404);
    }
    match = path.match(/^usuarios\/(\d+)$/);
    if (req.method === 'GET' && match) {
      const rows = await sql.query('select * from users where id = $1 limit 1', [match[1]]);
      return rows[0] ? ok(res, { sucesso: true, dados: userDto(rows[0]) }) : ok(res, { sucesso: false, mensagem: 'Usuário não encontrado.' }, 404);
    }

    match = path.match(/^vacinas\/(\d+)$/);
    if (req.method === 'GET' && match) {
      const rows = await sql.query('select id, nome, data_aplicacao as "dataAplicacao", lote, fabricante, proxima_dose as "proximaDose" from vacinas where usuario_id = $1 order by data_aplicacao desc', [match[1]]);
      return ok(res, { sucesso: true, dados: rows });
    }
    if (req.method === 'POST' && path === 'vacinas') {
      const rows = await sql.query('insert into vacinas (usuario_id,nome,data_aplicacao,lote,fabricante,proxima_dose,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,now(),now()) returning *', [body.usuarioId, body.nome, body.dataAplicacao, body.lote || null, body.fabricante || null, body.proximaDose || null]);
      return ok(res, { sucesso: true, mensagem: 'Vacina registrada.', dados: rows[0] }, 201);
    }

    match = path.match(/^dependentes\/(\d+)$/);
    if (req.method === 'GET' && match) {
      const rows = await sql.query('select id,nome,parentesco,data_nascimento as "dataNascimento" from dependentes where usuario_id=$1 order by id', [match[1]]);
      return ok(res, { sucesso: true, dados: rows });
    }
    if (req.method === 'POST' && path === 'dependentes') {
      const rows = await sql.query('insert into dependentes (usuario_id,nome,parentesco,data_nascimento,created_at,updated_at) values ($1,$2,$3,$4,now(),now()) returning *', [body.usuarioId, body.nome, body.parentesco, body.dataNascimento || null]);
      return ok(res, { sucesso: true, mensagem: 'Dependente cadastrado.', dados: rows[0] }, 201);
    }

    if (req.method === 'GET' && path === 'postos') {
      const rows = await sql.query('select id,nome,endereco,horario_funcionamento as "horarioFuncionamento",telefone,aberto from postos order by id');
      return ok(res, { sucesso: true, dados: rows });
    }
    if (req.method === 'GET' && path === 'campanhas') {
      const rows = await sql.query(`select id,titulo,descricao,to_char(data_inicio,'DD/MM/YYYY') as "dataInicio",to_char(data_fim,'DD/MM/YYYY') as "dataFim",status from campanhas order by data_inicio`);
      return ok(res, { sucesso: true, dados: rows });
    }
    match = path.match(/^notificacoes\/(\d+)$/);
    if (req.method === 'GET' && match) {
      const vacinas = await sql.query('select id,nome,proxima_dose from vacinas where usuario_id=$1 and proxima_dose is not null', [match[1]]);
      const dados = [{ id: 1, titulo: 'Bem-vindo ao EasyVacc', mensagem: 'Sua caderneta digital está pronta.', lida: true }, ...vacinas.map((v) => ({ id: Number(v.id) + 1, titulo: 'Próxima dose', mensagem: `A próxima dose de ${v.nome} está prevista para ${v.proxima_dose}.`, lida: false }))];
      return ok(res, { sucesso: true, dados });
    }
    return ok(res, { sucesso: false, mensagem: 'Rota não encontrada.' }, 404);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === '23505') return ok(res, { sucesso: false, mensagem: 'CPF, CNS ou e-mail já cadastrado.' }, 409);
    console.error(error);
    return ok(res, { sucesso: false, mensagem: 'Erro interno do servidor.' }, 500);
  }
}
