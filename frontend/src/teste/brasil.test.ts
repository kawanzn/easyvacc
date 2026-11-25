import { describe, expect, it } from 'vitest';
import { cpfValido, cnsValido, mascaraCpf, mascaraCns, senhaAtendeRequisitos, soDigitos } from '../lib/brasil';

describe('EasyVacc — validação de CPF', () => {
  it('aceita CPF com dígitos verificadores válidos', () => {
    expect(cpfValido('52998224725')).toBe(true);
    expect(cpfValido('529.982.247-25')).toBe(true);
  });

  it('rejeita CPF com dígitos verificadores incorretos', () => {
    expect(cpfValido('52998224726')).toBe(false);
  });

  it('rejeita CPF com dígitos repetidos ou tamanho incorreto', () => {
    expect(cpfValido('11111111111')).toBe(false);
    expect(cpfValido('123456789')).toBe(false);
    expect(cpfValido('')).toBe(false);
  });

  it('formata CPF sem alterar seus dígitos', () => {
    expect(mascaraCpf('52998224725')).toBe('529.982.247-25');
    expect(soDigitos('529.982.247-25')).toBe('52998224725');
  });
});

describe('EasyVacc — validação de CNS', () => {
  it('aceita CNS com soma ponderada válida', () => {
    expect(cnsValido('123456789000005')).toBe(true);
  });

  it('rejeita CNS com dígito incorreto, repetido ou tamanho inválido', () => {
    expect(cnsValido('123456789000006')).toBe(false);
    expect(cnsValido('111111111111111')).toBe(false);
    expect(cnsValido('123')).toBe(false);
  });

  it('formata CNS sem perder os dígitos', () => {
    expect(soDigitos(mascaraCns('123456789000005'))).toBe('123456789000005');
  });
});

describe('EasyVacc — requisitos de senha', () => {
  it('aceita senha com pelo menos oito caracteres, letra e número', () => {
    expect(senhaAtendeRequisitos('Vacina2026')).toBe(true);
  });

  it('rejeita senhas curtas ou sem letra ou número', () => {
    expect(senhaAtendeRequisitos('Vac1')).toBe(false);
    expect(senhaAtendeRequisitos('abcdefgh')).toBe(false);
    expect(senhaAtendeRequisitos('12345678')).toBe(false);
  });
});
