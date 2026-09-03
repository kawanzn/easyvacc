import { useState } from 'react';
import { Syringe, Calendar, Hash, Factory, Clock, ShieldAlert, CheckCircle, UserCheck, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PainelPosto() {
  const [cpfCidadao, setCpfCidadao] = useState(''); // <--- Novo estado para o CPF
  const [nome, setNome] = useState('');
  const [dataAplicacao, setDataAplicacao] = useState('');
  const [lote, setLote] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [proximaDose, setProximaDose] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const handleSalvarNoPosto = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem('');
    setErro('');

    try {
      // 1. Primeiro, buscamos o usuário no banco pelo CPF digitado
      const resBusca = await fetch(`http://localhost:5000/api/usuarios/cpf/${cpfCidadao}`);
      const dadosUsuario = await resBusca.json();

      if (!dadosUsuario.sucesso || !dadosUsuario.dados) {
        setErro('Cidadão não encontrado com este CPF. Verifique se ele já possui cadastro.');
        return;
      }

      const usuarioId = dadosUsuario.dados.id;

      // 2. Com o ID em mãos, registramos a vacina vinculada a ele
      const response = await fetch('http://localhost:5000/api/vacinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: Number(usuarioId),
          nome,
          dataAplicacao,
          lote,
          fabricante,
          proximaDose
        })
      });

      const data = await response.json();
      if (data.sucesso) {
        setMensagem(`Vacina registrada com sucesso para ${dadosUsuario.dados.nome}!`);
        setCpfCidadao('');
        setNome('');
        setDataAplicacao('');
        setLote('');
        setFabricante('');
        setProximaDose('');
      } else {
        setErro('Erro ao registrar vacina no sistema.');
      }
    } catch (error) {
      setErro('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      
      <div className="max-w-4xl mx-auto mb-8 border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-widest mb-1">
            <ShieldAlert size={16} /> Painel Exclusivo - Unidade Básica de Saúde
          </div>
          <h1 className="text-3xl font-black text-white">Portal do Atendente / Vacinação</h1>
        </div>
        <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 transition-colors">
          Sair do Painel
        </Link>
      </div>

      <div className="max-w-4xl mx-auto bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/80 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3 bg-teal-950/50 p-4 rounded-2xl border border-teal-800/50 text-teal-300 text-sm">
          <UserCheck size={20} className="shrink-0" />
          <span>Ambiente restrito a profissionais de saúde. Informe o CPF do cidadão para lançar a dose em sua caderneta digital.</span>
        </div>

        <form onSubmit={handleSalvarNoPosto} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Campo CPF do Cidadão */}
            <div className="col-span-1 md:col-span-2 bg-slate-900/60 p-5 rounded-2xl border border-slate-700">
              <label className="block text-xs font-bold text-teal-400 mb-2 uppercase tracking-wider">CPF do Cidadão (Paciente)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-teal-400" />
                </div>
                <input
                  type="text" required value={cpfCidadao} onChange={(e) => setCpfCidadao(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono text-lg"
                  placeholder="Digite o CPF do paciente..."
                />
              </div>
            </div>

            {/* Nome da Vacina */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Imunizante Aplicado</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Syringe className="h-5 w-5 text-teal-400" />
                </div>
                <input
                  type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Ex: Tríplice Viral, Febre Amarela, HPV..."
                />
              </div>
            </div>

            {/* Data de Aplicação */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Data da Aplicação</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-teal-400" />
                </div>
                <input
                  type="date" required value={dataAplicacao} onChange={(e) => setDataAplicacao(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Lote */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Lote do Imunizante</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-teal-400" />
                </div>
                <input
                  type="text" required value={lote} onChange={(e) => setLote(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Ex: LOTE-98821"
                />
              </div>
            </div>

            {/* Fabricante */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Laboratório / Fabricante</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Factory className="h-5 w-5 text-teal-400" />
                </div>
                <input
                  type="text" required value={fabricante} onChange={(e) => setFabricante(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Ex: Fiocruz, Butantan, Pfizer..."
                />
              </div>
            </div>

            {/* Próxima Dose */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Retorno / Próxima Dose (Se houver)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-teal-400" />
                </div>
                <input
                  type="date" value={proximaDose} onChange={(e) => setProximaDose(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

          </div>

          {mensagem && (
            <div className="bg-emerald-950/60 text-emerald-400 p-4 rounded-xl border border-emerald-800 flex items-center gap-2 text-sm font-semibold">
              <CheckCircle size={18} /> {mensagem}
            </div>
          )}

          {erro && (
            <div className="bg-rose-950/60 text-rose-400 p-4 rounded-xl border border-rose-800 text-sm font-semibold">
              {erro}
            </div>
          )}

          <div className="pt-4 border-t border-slate-700 flex justify-end">
            <button 
              type="submit" 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-4 px-8 rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-teal-500/10 active:scale-95"
            >
              Emitir e Registrar Dose no SUS
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}