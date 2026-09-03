import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Calendar, User, ArrowLeft } from 'lucide-react';

export default function AdicionarDependente() {
  const [nome, setNome] = useState('');
  const [parentesco, setParentesco] = useState('Filho(a)');
  const [dataNascimento, setDataNascimento] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    
    const usuarioId = localStorage.getItem('usuarioId');
    console.log("ID do usuário logado no localStorage:", usuarioId);

    if (!usuarioId) {
      setErro('Usuário não identificado. Faça login novamente.');
      return;
    }

    const payload = {
      usuarioId: Number(usuarioId),
      nome,
      parentesco,
      dataNascimento
    };

    console.log("Enviando payload para a API:", payload);

    try {
      const response = await fetch('http://localhost:5000/api/dependentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("Resposta da API:", data);

      if (data.sucesso) {
        alert('Dependente adicionado com sucesso!');
        navigate('/dashboard');
      } else {
        setErro(data.mensagem || 'Erro ao cadastrar dependente.');
      }
    } catch (err) {
      console.error("Erro de conexão:", err);
      setErro('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="p-8 animate-fade-in max-w-3xl mx-auto pb-20">
      <div className="mb-8 border-b border-slate-200 pb-4 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-800">Cadastrar Dependente</h1>
          <p className="text-slate-500 mt-1">Gerencie a caderneta de vacinação dos seus filhos e familiares.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSalvar} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Nome Completo do Dependente</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-teal-500" />
              </div>
              <input
                type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="Ex: Lucas Sampaio"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Parentesco</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-teal-500" />
                </div>
                <select
                  value={parentesco} onChange={(e) => setParentesco(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 transition-all"
                >
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Cônjuge">Cônjuge</option>
                  <option value="Pai / Mãe">Pai / Mãe</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Data de Nascimento</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-teal-500" />
                </div>
                <input
                  type="date" required value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-semibold">
              {erro}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link to="/dashboard" className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
              Cancelar
            </Link>
            <button type="submit" className="px-6 py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20">
              Salvar Dependente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}