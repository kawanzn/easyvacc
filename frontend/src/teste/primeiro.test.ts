import { describe, it, expect } from 'vitest';

describe('EasyVacc - Testes iniciais', () => {
  it('deve executar os testes corretamente', () => {
    expect(1 + 1).toBe(2);
  });

  it('deve reconhecer um CPF com 11 dígitos', () => {
    const cpf = '12345678909';

    expect(cpf).toHaveLength(11);
  });
});