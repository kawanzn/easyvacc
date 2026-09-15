export const TERMOS_VERSAO = '2026-09-15';
export const PRIVACIDADE_VERSAO = '2026-09-15';

export function soDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function mascaraCpf(valor: string): string {
  const d = soDigitos(valor).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function mascaraCns(valor: string): string {
  const d = soDigitos(valor).slice(0, 15);
  return d.replace(/(\d{3})(\d{4})(\d{4})(\d{0,4})/, (_, a, b, c, e) =>
    [a, b, c, e].filter(Boolean).join(' ')
  );
}

export function cpfValido(cpfInformado: string): boolean {
  const cpf = soDigitos(cpfInformado);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calc = (base: string, fator: number) => {
    let soma = 0;
    for (const digito of base) {
      soma += Number(digito) * fator;
      fator -= 1;
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export function cnsValido(cnsInformado: string): boolean {
  const cns = soDigitos(cnsInformado);
  if (cns.length !== 15 || /^(\d)\1{14}$/.test(cns)) {
    return false;
  }

  const somaPonderada = (valor: string) =>
    valor.split('').reduce((acc, digito, i) => acc + Number(digito) * (15 - i), 0);

  if (cns[0] === '7' || cns[0] === '8' || cns[0] === '9') {
    return somaPonderada(cns) % 11 === 0;
  }

  if (cns[0] !== '1' && cns[0] !== '2') {
    return false;
  }

  const pis = cns.slice(0, 11);
  let soma = 0;
  for (let i = 0; i < 11; i += 1) {
    soma += Number(pis[i]) * (15 - i);
  }
  let dv = 11 - (soma % 11);
  if (dv === 11) dv = 0;
  let resultado: string;
  if (dv === 10) {
    soma += 2;
    dv = 11 - (soma % 11);
    if (dv === 11) dv = 0;
    resultado = `${pis}001${dv}`;
  } else {
    resultado = `${pis}${dv}000`;
  }
  return resultado === cns;
}

export function senhaAtendeRequisitos(senha: string): boolean {
  return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
}

export type PessoaAtiva = {
  tipo: 'titular' | 'dependente';
  id: number;
  nome: string;
  parentesco?: string;
};

const PESSOA_KEY = 'pessoaAtiva';

export function lerPessoaAtiva(): PessoaAtiva | null {
  try {
    const bruto = localStorage.getItem(PESSOA_KEY);
    return bruto ? (JSON.parse(bruto) as PessoaAtiva) : null;
  } catch {
    return null;
  }
}

export function salvarPessoaAtiva(pessoa: PessoaAtiva) {
  localStorage.setItem(PESSOA_KEY, JSON.stringify(pessoa));
}
