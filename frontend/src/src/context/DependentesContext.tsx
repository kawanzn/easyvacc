import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Dependente {
  id: string;
  nome: string;
  parentesco: string;
  dataNascimento: string;
  cns: string;
  statusVacinal: string;
  comprovanteUrl?: string; // Para comprovação de vínculo (P0)
}

export interface HistoricoAcao {
  id: string;
  acao: 'INCLUSAO' | 'ALTERACAO' | 'REMOCAO';
  descricao: string;
  dataHora: string;
}

interface DependentesContextType {
  dependentes: Dependente[];
  dependenteAtivo: Dependente | null; // Titular ou dependente selecionado (P1)
  setDependenteAtivo: (dep: Dependente | null) => void;
  historico: HistoricoAcao[];
  adicionarDependente: (dados: Omit<Dependente, 'id' | 'statusVacinal'>) => boolean;
  removerDependente: (id: string) => void;
  carregando: boolean;
}

const DependentesContext = createContext<DependentesContextType | undefined>(undefined);

// Validador básico de CNS (Cartão Nacional de Saúde) - P2
function validarCNS(cns: string): boolean {
  if (!cns || cns.trim() === '') return true; // Se opcional, ou torne obrigatório se preferir
  const limpo = cns.replace(/\D/g, '');
  if (limpo.length !== 15) return false;
  // Regra padrão simplificada de validação do CNS (começados em 1 ou 2, ou 7, 8, 9)
  return /^([1-2][0-9]{14}|[7-9][0-9]{14})$/.test(limpo);
}

export function DependentesProvider({ children }: { children: ReactNode }) {
  const [dependentes, setDependentes] = useState<Dependente[]>(() => {
    try {
      const salvo = localStorage.getItem('@EasyVacc:dependentes');
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [dependenteAtivo, setDependenteAtivo] = useState<Dependente | null>(() => {
    try {
      const ativoSalvo = localStorage.getItem('@EasyVacc:dependenteAtivo');
      return ativoSalvo ? JSON.parse(ativoSalvo) : null;
    } catch {
      return null;
    }
  });

  const [historico, setHistorico] = useState<HistoricoAcao[]>(() => {
    try {
      const histSalvo = localStorage.getItem('@EasyVacc:historicoDependentes');
      return histSalvo ? JSON.parse(histSalvo) : [];
    } catch {
      return [];
    }
  });

  const [carregando] = useState(false);

  // Sincroniza com localStorage e dispara eventos globais (Fonte única - P0)
  useEffect(() => {
    try {
      localStorage.setItem('@EasyVacc:dependentes', JSON.stringify(dependentes));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Erro ao salvar dependentes', e);
    }
  }, [dependentes]);

  useEffect(() => {
    try {
      if (dependenteAtivo) {
        localStorage.setItem('@EasyVacc:dependenteAtivo', JSON.stringify(dependenteAtivo));
      } else {
        localStorage.removeItem('@EasyVacc:dependenteAtivo');
      }
    } catch (e) {
      console.error('Erro ao salvar dependente ativo', e);
    }
  }, [dependenteAtivo]);

  useEffect(() => {
    try {
      localStorage.setItem('@EasyVacc:historicoDependentes', JSON.stringify(historico));
    } catch (e) {
      console.error('Erro ao salvar histórico', e);
    }
  }, [historico]);

  const registrarHistorico = (acao: 'INCLUSAO' | 'ALTERACAO' | 'REMOCAO', descricao: string) => {
    const novoRegistro: HistoricoAcao = {
      id: Date.now().toString(),
      acao,
      descricao,
      dataHora: new Date().toLocaleString('pt-BR'),
    };
    setHistorico((prev) => [novoRegistro, ...prev]);
  };

  const adicionarDependente = (dados: Omit<Dependente, 'id' | 'statusVacinal'>) => {
    // Validação de CNS (P2)
    if (dados.cns && !validarCNS(dados.cns)) {
      alert('Número do Cartão SUS (CNS) inválido. Deve conter 15 dígitos.');
      return false;
    }

    const novo: Dependente = {
      id: Date.now().toString(),
      ...dados,
      statusVacinal: 'Em dia',
    };

    setDependentes((prev) => [...prev, novo]);
    registrarHistorico('INCLUSAO', `Dependente ${novo.nome} (${novo.parentesco}) cadastrado.`);
    return true;
  };

  const removerDependente = (id: string) => {
    const alvo = dependentes.find((d) => d.id === id);
    if (!alvo) return;

    // Confirmação obrigatória antes de remover (P1)
    const confirmado = window.confirm(`Tem certeza que deseja remover o dependente "${alvo.nome}"? Esta ação exige autorização.`);
    if (!confirmado) return;

    setDependentes((prev) => prev.filter((d) => d.id !== id));
    
    // Se o dependente removido era o ativo, reseta para a conta pessoal (Titular)
    if (dependenteAtivo?.id === id) {
      setDependenteAtivo(null);
    }

    registrarHistorico('REMOCAO', `Dependente ${alvo.nome} removido do sistema.`);
  };

  return (
    <DependentesContext.Provider
      value={{
        dependentes,
        dependenteAtivo,
        setDependenteAtivo,
        historico,
        adicionarDependente,
        removerDependente,
        carregando,
      }}
    >
      {children}
    </DependentesContext.Provider>
  );
}

export function useDependentes() {
  const context = useContext(DependentesContext);
  if (!context) {
    throw new Error('useDependentes deve ser usado dentro de um DependentesProvider');
  }
  return context;
}