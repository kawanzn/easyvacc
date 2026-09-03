// ======================================================
// PÁGINA DE LOGIN - EASYVACC
// ======================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';


// ======================================================
// URL DO BACKEND
// ======================================================
//
// Em desenvolvimento:
// usa http://localhost:5000
//
// Quando o projeto estiver publicado na Vercel:
// vamos criar a variável VITE_API_URL com a URL
// pública do nosso backend.
//
// Exemplo futuro:
// VITE_API_URL=https://meu-backend.com
//
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';


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

    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">


      {/* ==================================================
          CÍRCULOS DECORATIVOS DO FUNDO
          ================================================== */}

      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-100/60 rounded-full blur-3xl -z-10"></div>

      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl -z-10"></div>


      {/* ==================================================
          BOTÃO VOLTAR
          ================================================== */}

      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100"
      >

        <ArrowLeft size={18} />

        Voltar ao Início

      </Link>


      {/* ==================================================
          CARD DO LOGIN
          ================================================== */}

      <div className="bg-white/80 backdrop-blur-xl max-w-md w-full rounded-[2.5rem] shadow-xl shadow-teal-900/5 p-8 md:p-10 border border-white">


        {/* ==================================================
            LOGO + TÍTULO
            ================================================== */}

        <div className="text-center mb-8 flex flex-col items-center">

          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm p-2">

            <img
              src="/logo.png"
              alt="Logo EasyVacc"
              className="w-full h-full object-contain"
            />

          </div>


          <h1 className="text-3xl font-black text-slate-800 tracking-tight">

            Entrar no{' '}

            <span className="text-teal-600">
              EasyVacc
            </span>

          </h1>


          <p className="text-slate-500 mt-2 text-sm font-medium">

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

            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">

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

              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />

          </div>


          {/* ================= SENHA ================= */}

          <div>

            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">

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

              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />

          </div>


          {/* ==================================================
              MENSAGEM DE ERRO
              ================================================== */}

          {erro && (

            <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold text-center p-3 rounded-xl">

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

            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl py-4 font-black text-lg hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all mt-4 shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >

            <Lock size={18} />


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

        <div className="mt-8 text-center border-t border-slate-100 pt-6 space-y-3">


          {/* CADASTRO */}

          <div>

            <span className="text-sm text-slate-500">

              Ainda não tem uma caderneta?{' '}

            </span>


            <Link
              to="/cadastro"
              className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
            >

              Cadastre-se aqui

            </Link>

          </div>


          {/* RECUPERAÇÃO DE SENHA */}

          <div>

            <a
              href="#"
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >

              Esqueci minha senha

            </a>

          </div>


          {/* ACESSO ADMINISTRATIVO */}

          <div className="mt-6 text-center">

            <Link
              to="/admin"
              className="text-xs font-semibold text-slate-400 hover:text-teal-600 transition-colors"
            >

              Acesso Restrito: Profissionais de Saúde / Posto

            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}