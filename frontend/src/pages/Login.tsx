// ======================================================
// PÁGINA DE LOGIN - EASYVACC
// ======================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { API_URL } from '../lib/api';


// ======================================================
// URL DO BACKEND
// ======================================================
//
// Em desenvolvimento:
// usa http://localhost:8000
//
// Quando o projeto estiver publicado na Vercel:
// vamos criar a variável VITE_API_URL com a URL
// pública do nosso backend.
//
// Exemplo futuro:
// VITE_API_URL=https://meu-backend.com
//
export default function Login() {

  // ======================================================
  // ESTADOS
  // ======================================================

  // Guarda o CPF digitado.
  const [cpf, setCpf] = useState('');

  // Guarda a senha digitada.
  const [senha, setSenha] = useState('');

  // Controla o estado do botão durante o login.
  const [carregando, setCarregando] = useState(false);

  // Guarda uma mensagem de erro para mostrar na tela.
  const [erro, setErro] = useState('');


  // Permite redirecionar o usuário para outra página.
  const navigate = useNavigate();


  // ======================================================
  // FUNÇÃO DE LOGIN
  // ======================================================

  const handleLogin = async (e: React.FormEvent) => {

    // Evita que o formulário recarregue a página.
    e.preventDefault();

    // Limpa erros anteriores.
    setErro('');

    // Ativa o estado de carregamento.
    setCarregando(true);

    try {

      // ==================================================
      // REQUISIÇÃO PARA O BACKEND
      // ==================================================

      const response = await fetch(
        `${API_URL}/api/usuarios/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          // Envia CPF e senha para o backend.
          body: JSON.stringify({
            cpf,
            senha
          })
        }
      );


      // ==================================================
      // TRATAMENTO DA RESPOSTA
      // ==================================================

      const data = await response.json();


      if (data.sucesso) {

        // Salva o ID do usuário no navegador.
        //
        // As outras páginas utilizam esse ID para saber
        // qual usuário está logado.
        localStorage.setItem(
          'usuarioId',
          String(data.dados.id)
        );


        // Após o login, envia o usuário para o histórico.
        navigate('/historico');

      } else {

        // Caso o backend informe CPF/senha incorretos
        // ou outro problema de autenticação.
        setErro(
          data.mensagem || 'Não foi possível realizar o login.'
        );
      }


    } catch (error) {

      // ==================================================
      // ERRO DE CONEXÃO
      // ==================================================
      //
      // Normalmente acontece quando:
      //
      // - backend está desligado;
      // - URL está errada;
      // - backend ainda não foi publicado;
      // - existe algum problema de CORS.
      //

      console.error(
        'Erro ao conectar com o servidor:',
        error
      );

      setErro(
        'Erro ao conectar com o servidor.'
      );

    } finally {

      // Independente de sucesso ou erro,
      // libera novamente o botão.
      setCarregando(false);
    }
  };


  // ======================================================
  // INTERFACE
  // ======================================================

  return (

    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden antialiased">


      {/* ==================================================
          CÍRCULOS DECORATIVOS DO FUNDO
          ================================================== */}

      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-[#00a884]/10 rounded-full blur-3xl -z-10"></div>


      {/* ==================================================
          BOTÃO VOLTAR
          ================================================== */}

      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white font-semibold text-xs transition-all bg-slate-900/80 hover:bg-slate-900 px-4 py-2.5 rounded-full border border-slate-800 shadow-lg backdrop-blur-md"
      >

        <ArrowLeft size={16} />

        Voltar ao Início

      </Link>


      {/* ==================================================
          CARD DO LOGIN
          ================================================== */}

      <div className="bg-slate-900/90 backdrop-blur-xl max-w-md w-full rounded-3xl shadow-2xl shadow-emerald-950/20 p-8 md:p-10 border border-slate-800 relative z-10">


        {/* ==================================================
            LOGO + TÍTULO
            ================================================== */}

        <div className="text-center mb-8 flex flex-col items-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm">
            <img 
              src="/logo.png" 
              alt="EasyVacc Logo" 
              className="h-full w-full object-contain" 
            />
          </div>


          <h1 className="text-3xl font-extrabold text-white tracking-tight">

            Entrar no{' '}

            <span className="text-[#00a884]">
              EasyVacc
            </span>

          </h1>


          <p className="text-slate-400 mt-2 text-xs font-medium leading-relaxed">

            Acesse com seu CPF para visualizar seu histórico de vacinação.

          </p>

        </div>


        {/* ==================================================
            FORMULÁRIO
            ================================================== */}

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >


          {/* ================= CPF ================= */}

          <div>

            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">

              CPF

            </label>


            <input
              type="text"

              placeholder="Digite seu CPF"

              value={cpf}

              onChange={(e) =>
                setCpf(e.target.value)
              }

              required

              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-600 focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all text-sm font-medium"
            />

          </div>


          {/* ================= SENHA ================= */}

          <div>

            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">

              Senha

            </label>


            <input
              type="password"

              placeholder="Sua senha"

              value={senha}

              onChange={(e) =>
                setSenha(e.target.value)
              }

              required

              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-600 focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all text-sm font-medium"
            />

          </div>


          {/* ==================================================
              MENSAGEM DE ERRO
              ================================================== */}

          {erro && (

            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold text-center p-3 rounded-xl">

              {erro}

            </div>

          )}


          {/* ==================================================
              BOTÃO DE LOGIN
              ================================================== */}

          <button
            type="submit"

            // Evita vários cliques enquanto
            // a requisição está acontecendo.
            disabled={carregando}

            className="w-full bg-gradient-to-r from-[#00a884] to-teal-500 text-slate-950 rounded-xl py-3.5 font-bold text-sm hover:brightness-110 active:scale-[0.99] transition-all mt-4 shadow-lg shadow-[#00a884]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >

            <Lock size={16} />


            {/* Muda o texto enquanto está conectando */}

            {carregando
              ? 'Entrando...'
              : 'Entrar na Caderneta'
            }

          </button>

        </form>


        {/* ==================================================
            RODAPÉ
            ================================================== */}

        <div className="mt-8 text-center border-t border-slate-800 pt-6 space-y-3">


          {/* CADASTRO */}

          <div>

            <span className="text-xs text-slate-400">

              Ainda não tem uma caderneta?{' '}

            </span>


            <Link
              to="/cadastro"
              className="text-xs font-bold text-[#00a884] hover:text-[#00c49a] transition-colors"
            >

              Cadastre-se aqui

            </Link>

          </div>


          {/* RECUPERAÇÃO DE SENHA */}

          <div>

            <a
              href="#"
              className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
            >

              Esqueci minha senha

            </a>

          </div>


          {/* ACESSO ADMINISTRATIVO */}

          <div className="mt-6 text-center">

            <Link
              to="/admin"
              className="text-xs font-semibold text-slate-500 hover:text-[#00a884] transition-colors"
            >

              Acesso Restrito: Profissionais de Saúde / Posto

            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}