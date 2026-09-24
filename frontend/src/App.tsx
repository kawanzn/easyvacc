import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import { DependentesProvider } from './context/DependentesContext';

// ============================================
// PÁGINAS PÚBLICAS
// ============================================

import Cadastro from './pages/Cadastro';
import Landing from './pages/Landing';
import Login from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import ConfirmarEmail from './pages/ConfirmarEmail';

import {
  PoliticaPrivacidade,
  TermosUso,
} from './pages/DocumentosLegais';

// ============================================
// CADERNETA DO CIDADÃO
// ============================================

import Dashboard from './pages/Dashboard';
import Historico from './pages/Historico';
import Perfil from './pages/Perfil';
import Certificado from './pages/Certificado';
import Dependentes from './pages/Dependentes';
import AdicionarDependente from './pages/AdicionarDependente';
import Notificacoes from './pages/Notificacoes';
import Campanhas from './pages/Campanhas';
import Postos from './pages/Postos';

// ============================================
// PROFISSIONAIS
// ============================================

import LoginProfissional from './pages/LoginProfissional';
import PainelPosto from './pages/PainelPosto';

import RotaProfissional from './components/RotaProfissional';

// ============================================
// LAYOUT
// ============================================

import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <DependentesProvider>
        <Routes>

          {/* ======================================
              ROTAS PÚBLICAS
          ====================================== */}

          <Route
            path="/"
            element={<Landing />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/cadastro"
            element={<Cadastro />}
          />

          <Route
            path="/recuperar-senha"
            element={<RecuperarSenha />}
          />

          <Route
            path="/confirmar-email"
            element={<ConfirmarEmail />}
          />

          <Route
            path="/privacidade"
            element={<PoliticaPrivacidade />}
          />

          <Route
            path="/termos"
            element={<TermosUso />}
          />

          {/* ======================================
              LOGIN PROFISSIONAL
          ====================================== */}

          <Route
            path="/profissional/login"
            element={<LoginProfissional />}
          />

          {/* ======================================
              PAINEL PROFISSIONAL PROTEGIDO
          ====================================== */}

          <Route
            path="/admin"
            element={
              <RotaProfissional>
                <PainelPosto />
              </RotaProfissional>
            }
          />

          {/* ======================================
              ÁREA DO CIDADÃO
          ====================================== */}

          <Route element={<Layout />}>

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/historico"
              element={<Historico />}
            />

            <Route
              path="/perfil"
              element={<Perfil />}
            />

            <Route
              path="/certificado"
              element={<Certificado />}
            />

            <Route
              path="/dependentes"
              element={<Dependentes />}
            />

            <Route
              path="/adicionar-dependente"
              element={<AdicionarDependente />}
            />

            <Route
              path="/notificacoes"
              element={<Notificacoes />}
            />

            <Route
              path="/campanhas"
              element={<Campanhas />}
            />

            <Route
              path="/postos"
              element={<Postos />}
            />

          </Route>

        </Routes>
      </DependentesProvider>
    </BrowserRouter>
  );
}

export default App;