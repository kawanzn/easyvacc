// ======================================================
// CADASTRO DE USUÁRIO - DARK HEALTH TECH DESIGN SYSTEM
// ======================================================

// useState permite guardar os valores digitados nos campos.
import { useState } from 'react';

// useNavigate permite redirecionar o usuário.
// Link permite navegar entre páginas sem recarregar o site.
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

// Ícones utilizados nos campos do formulário.
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
      const data = await api<{ sucesso: boolean; mensagem?: string }>('/api/usuarios/cadastro', {
        method: 'POST',
        body: JSON.stringify({ nome, cpf, cns, email, cidade, senha })
      });


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
        setErro(data.mensagem || 'Não foi possível concluir o cadastro.');
      }

    } catch (error) {

      // Esse bloco normalmente é executado quando
      // o frontend não consegue alcançar o backend.
      console.error('Erro ao realizar cadastro:', error);

      setErro(error instanceof Error ? error.message : 'Erro ao conectar com o servidor.');
    }
  };


  // ======================================================
  // INTERFACE DA PÁGINA
  // ======================================================

  return (

    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">

      {/* ==================================================
          DECORAÇÃO DO FUNDO (DARK HEALTH TECH)
          ================================================== */}

      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>

      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10"></div>


      {/* ==================================================
          CARD PRINCIPAL
          ================================================== */}

      <div className="bg-slate-900/90 backdrop-blur-xl max-w-xl w-full rounded-[2.5rem] shadow-2xl shadow-black/50 p-8 md:p-10 border border-slate-800 my-8">


        {/* TÍTULO */}

        <div className="text-center mb-8">

          <h2 className="text-3xl font-black text-white tracking-tight">
            Criar nova conta
          </h2>

          <p className="text-slate-400 mt-2 text-sm font-medium">

            Ou{' '}

            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
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

            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
              Nome Completo
            </label>

            <div className="relative">

              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                <User className="h-5 w-5 text-slate-500" />

              </div>

              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                placeholder="Seu nome completo"
              />

            </div>

          </div>


          {/* CPF + CARTÃO SUS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


            {/* ================= CPF ================= */}

            <div>

              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                CPF
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <FileText className="h-5 w-5 text-slate-500" />

                </div>

                <input
                  type="text"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                  placeholder="Somente números"
                />

              </div>

            </div>


            {/* ================= CARTÃO SUS ================= */}

            <div>

              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                Cartão SUS
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <FileText className="h-5 w-5 text-slate-500" />

                </div>

                <input
                  type="text"
                  required
                  value={cns}
                  onChange={(e) => setCns(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                  placeholder="Número do CNS"
                />

              </div>

            </div>

          </div>


          {/* ================= E-MAIL ================= */}

          <div>

            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
              E-mail
            </label>

            <div className="relative">

              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                <Mail className="h-5 w-5 text-slate-500" />

              </div>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                placeholder="seu@email.com"
              />

            </div>

          </div>


          {/* CIDADE + SENHA */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


            {/* ================= CIDADE ================= */}

            <div>

              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                Cidade
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <MapPin className="h-5 w-5 text-slate-500" />

                </div>

                <input
                  type="text"
                  required
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                  placeholder="Sua cidade"
                />

              </div>

            </div>


            {/* ================= SENHA ================= */}

            <div>

              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                Senha
              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <Lock className="h-5 w-5 text-slate-500" />

                </div>

                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
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

            <div className="bg-red-950/50 text-red-400 p-3 rounded-lg text-sm text-center font-semibold mt-4 border border-red-900/50">

              {erro}

            </div>

          )}


          {/* ==================================================
              BOTÃO DE CADASTRO
              Como type="submit", executa handleCadastro.
              ================================================== */}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl py-4 font-bold text-base hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all mt-6 shadow-lg shadow-emerald-950/50"
          >
            Finalizar Cadastro
          </button>

        </form>

      </div>

    </div>
  );
}