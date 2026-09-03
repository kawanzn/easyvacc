// ======================================================
// CADASTRO DE USUÁRIO
// ======================================================

// useState permite guardar os valores digitados nos campos.
import { useState } from 'react';

// useNavigate permite redirecionar o usuário.
// Link permite navegar entre páginas sem recarregar o site.
import { useNavigate, Link } from 'react-router-dom';

// Ícones utilizados nos campos do formulário.
// ArrowLeft foi removido porque não estava sendo utilizado
// e isso estava causando erro TS6133 no build da Vercel.
import {
  User,
  Lock,
  FileText,
  Mail,
  MapPin
} from 'lucide-react';


export default function Cadastro() {

  // ======================================================
  // ESTADOS DO FORMULÁRIO
  // ======================================================
  // Cada estado guarda o conteúdo de um campo.

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cns, setCns] = useState('');
  const [email, setEmail] = useState('');
  const [cidade, setCidade] = useState('');
  const [senha, setSenha] = useState('');

  // Guarda uma mensagem de erro caso o cadastro falhe.
  const [erro, setErro] = useState('');


  // ======================================================
  // NAVEGAÇÃO
  // ======================================================

  // Permite enviar o usuário para outra página pelo código.
  const navigate = useNavigate();


  // ======================================================
  // FUNÇÃO DE CADASTRO
  // ======================================================

  // Essa função é executada quando o usuário
  // clica no botão "Finalizar Cadastro".
  const handleCadastro = async (e: React.FormEvent) => {

    // Impede o formulário de recarregar a página.
    e.preventDefault();

    // Limpa qualquer erro anterior.
    setErro('');

    try {

      // Envia os dados digitados para o backend.
      //
      // IMPORTANTE:
      // localhost funciona enquanto estamos desenvolvendo
      // no computador.
      //
      // Depois vamos trocar isso para funcionar
      // com o backend hospedado online.
      const response = await fetch(
        'http://localhost:5000/api/usuarios/cadastro',
        {
          method: 'POST',

          // Informa ao backend que estamos enviando JSON.
          headers: {
            'Content-Type': 'application/json'
          },

          // Transforma os dados do formulário em JSON.
          body: JSON.stringify({
            nome,
            cpf,
            cns,
            email,
            cidade,
            senha
          })
        }
      );


      // Converte a resposta do servidor para JavaScript.
      const data = await response.json();


      // ==================================================
      // VERIFICA O RESULTADO DO CADASTRO
      // ==================================================

      if (data.sucesso) {

        // Cadastro realizado.
        alert('Cadastro realizado com sucesso! Faça seu login.');

        // Redireciona para a página de login.
        navigate('/login');

      } else {

        // O servidor respondeu, mas informou algum erro.
        setErro(data.mensagem);
      }

    } catch (error) {

      // Esse bloco normalmente é executado quando
      // o frontend não consegue alcançar o backend.
      console.error('Erro ao realizar cadastro:', error);

      setErro('Erro ao conectar com o servidor.');
    }
  };


  // ======================================================
  // INTERFACE DA PÁGINA
  // ======================================================

  return (

    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">

      {/* ==================================================
          DECORAÇÃO DO FUNDO
          ================================================== */}

      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-100/60 rounded-full blur-3xl -z-10"></div>

      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl -z-10"></div>


      {/* ==================================================
          CARD PRINCIPAL
          ================================================== */}

      <div className="bg-white/80 backdrop-blur-xl max-w-xl w-full rounded-[2.5rem] shadow-xl shadow-teal-900/5 p-8 md:p-10 border border-white my-8">


        {/* TÍTULO */}

        <div className="text-center mb-8">

          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Criar nova conta
          </h2>

          <p className="text-slate-500 mt-2 text-sm font-medium">

            Ou{' '}

            <Link
              to="/login"
              className="text-teal-600 hover:text-teal-700 font-bold transition-colors"
            >
              já tenho uma conta (Fazer Login)
            </Link>

          </p>

        </div>


        {/* ==================================================
            FORMULÁRIO
            ================================================== */}

        <form
          className="space-y-5"
          onSubmit={handleCadastro}
        >


          {/* ================= NOME ================= */}

          <div>

            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Nome Completo
            </label>

            <div className="relative">

              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                <User className="h-5 w-5 text-gray-400" />

              </div>

              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="Seu nome completo"
              />

            </div>

          </div>


          {/* CPF + CARTÃO SUS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


            {/* ================= CPF ================= */}

            <div>

              <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                CPF
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <FileText className="h-5 w-5 text-gray-400" />

                </div>

                <input
                  type="text"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Somente números"
                />

              </div>

            </div>


            {/* ================= CARTÃO SUS ================= */}

            <div>

              <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                Cartão SUS
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <FileText className="h-5 w-5 text-gray-400" />

                </div>

                <input
                  type="text"
                  required
                  value={cns}
                  onChange={(e) => setCns(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Número do CNS"
                />

              </div>

            </div>

          </div>


          {/* ================= E-MAIL ================= */}

          <div>

            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              E-mail
            </label>

            <div className="relative">

              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                <Mail className="h-5 w-5 text-gray-400" />

              </div>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="seu@email.com"
              />

            </div>

          </div>


          {/* CIDADE + SENHA */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


            {/* ================= CIDADE ================= */}

            <div>

              <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                Cidade
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <MapPin className="h-5 w-5 text-gray-400" />

                </div>

                <input
                  type="text"
                  required
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Sua cidade"
                />

              </div>

            </div>


            {/* ================= SENHA ================= */}

            <div>

              <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                Senha
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <Lock className="h-5 w-5 text-gray-400" />

                </div>

                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Crie uma senha"
                />

              </div>

            </div>

          </div>


          {/* ==================================================
              MENSAGEM DE ERRO
              Só aparece quando a variável "erro" possuir texto.
              ================================================== */}

          {erro && (

            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-semibold mt-4 border border-red-100">

              {erro}

            </div>

          )}


          {/* ==================================================
              BOTÃO DE CADASTRO
              Como type="submit", executa handleCadastro.
              ================================================== */}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl py-4 font-black text-lg hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all mt-6 shadow-lg shadow-teal-600/20"
          >
            Finalizar Cadastro
          </button>

        </form>

      </div>

    </div>
  );
}