import { Navigate } from 'react-router-dom';

/**
 * Mantém a rota /adicionar-dependente funcionando, mas utiliza
 * o formulário único de cadastro existente em Dependentes.tsx.
 * Assim, não há dois cadastros diferentes para a mesma operação.
 */
export default function AdicionarDependente() {
  return <Navigate to="/dependentes?adicionar=1" replace />;
}
