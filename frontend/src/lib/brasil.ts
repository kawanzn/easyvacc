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

  return d.replace(
    /(\d{3})(\d{4})(\d{4})(\d{0,4})/,
    (_, a, b, c, e) =>
      [a, b, c, e].filter(Boolean).join(' ')
  );
}

export function cpfValido(cpfInformado: string): boolean {
  const cpf = soDigitos(cpfInformado);

  if (
    cpf.length !== 11 ||
    /^(\d)\1{10}$/.test(cpf)
  ) {
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

  return (
    d1 === Number(cpf[9]) &&
    d2 === Number(cpf[10])
  );
}

export function cnsValido(cnsInformado: string): boolean {
  const cns = soDigitos(cnsInformado);

  if (cns.length !== 15) {
    return false;
  }

  if (/^(\d)\1{14}$/.test(cns)) {
    return false;
  }

  if (!/^[12789]/.test(cns)) {
    return false;
  }

  const pesos = [
    15, 14, 13, 12, 11,
    10, 9, 8, 7, 6,
    5, 4, 3, 2, 1,
  ];

  const soma = cns
    .split('')
    .reduce(
      (total, digito, indice) =>
        total + Number(digito) * pesos[indice],
      0
    );

  return soma % 11 === 0;
}

export function senhaAtendeRequisitos(senha: string): boolean {
  return (
    senha.length >= 8 &&
    /[A-Za-z]/.test(senha) &&
    /\d/.test(senha)
  );
}

export type PessoaAtiva = {
  tipo: 'titular' | 'dependente';
  id: string | number;
  nome: string;
  parentesco?: string;
};

const PESSOA_KEY = 'pessoaAtiva';

export function lerPessoaAtiva(): PessoaAtiva | null {
  try {
    const bruto = localStorage.getItem(PESSOA_KEY);

    return bruto
      ? (JSON.parse(bruto) as PessoaAtiva)
      : null;
  } catch {
    return null;
  }
}

export function salvarPessoaAtiva(pessoa: PessoaAtiva) {
  localStorage.setItem(
    PESSOA_KEY,
    JSON.stringify(pessoa)
  );
}