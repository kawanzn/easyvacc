import { lerPessoaAtiva, soDigitos } from './brasil';

export function queryPessoa(): string {
  const pessoa = lerPessoaAtiva();
  if (pessoa?.tipo === 'dependente') {
    return `pessoa=dependente&dependenteId=${pessoa.id}`;
  }
  return 'pessoa=titular';
}

export function mascararCpf(cpf: string): string {
  const d = soDigitos(cpf);
  if (d.length !== 11) return cpf || 'Não informado';
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}

export function mascararCns(cns: string): string {
  const d = soDigitos(cns);
  if (d.length !== 15) return cns || 'Não informado';
  return `${d.slice(0, 3)} ${d.slice(3, 7)} **** ${d.slice(11)}`;
}

export const ATALHOS_DISPONIVEIS = [
  { id: '/historico', rotulo: 'Histórico de vacinação' },
  { id: '/certificado', rotulo: 'Certificado' },
  { id: '/postos', rotulo: 'Postos de saúde' },
  { id: '/perfil', rotulo: 'Dados pessoais' },
  { id: '/campanhas', rotulo: 'Campanhas' },
  { id: '/dependentes', rotulo: 'Dependentes' },
  { id: '/notificacoes', rotulo: 'Notificações' },
] as const;

const ATALHOS_KEY = 'atalhosDashboard';

export function lerAtalhos(): string[] {
  try {
    const bruto = localStorage.getItem(ATALHOS_KEY);
    const lista = bruto ? (JSON.parse(bruto) as string[]) : null;
    if (Array.isArray(lista) && lista.length > 0) return lista;
  } catch {
    /* ignore */
  }
  return ['/historico', '/certificado', '/postos', '/perfil'];
}

export function salvarAtalhos(ids: string[]) {
  localStorage.setItem(ATALHOS_KEY, JSON.stringify(ids));
}
