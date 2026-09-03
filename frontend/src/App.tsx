// Importa somente o que realmente usamos do React Router.
// "useLocation" foi removido porque não estava sendo utilizado
// e estava causando erro TS6133 no build da Vercel.
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Páginas públicas
import Cadastro from './pages/Cadastro';
import Landing from './pages/Landing';
import Login from './pages/Login';

// Páginas da caderneta
import Dashboard from './pages/Dashboard';
import Historico from './pages/Historico';
import Perfil from './pages/Perfil';
import Certificado from './pages/Certificado';
import AdicionarDependente from './pages/AdicionarDependente';
import Notificacoes from './pages/Notificacoes';
import Campanhas from './pages/Campanhas';
import Postos from './pages/Postos';

// Layout com o menu lateral
import Layout from './components/Layout';

// Painel administrativo do posto
import PainelPosto from './pages/PainelPosto';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            ROTAS SEM MENU LATERAL
            ===================================================== */}

        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />

        <Route path="/cadastro" element={<Cadastro />} />

        <Route path="/admin" element={<PainelPosto />} />


        {/* =====================================================
            ROTAS COM MENU LATERAL
            Todas ficam dentro do componente Layout.
            ===================================================== */}

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
    </BrowserRouter>
  );
}

export default App;