import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  User, 
  ShieldCheck, 
  Trash2, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  Calendar, 
  CreditCard 
} from 'lucide-react';

interface Dependente {
  id: string;
  nome: string;
  parentesco: string;
  dataNascimento: string;
  cartaoSus: string;
  statusVacinal: string;
}

// Função auxiliar para formatar a data de YYYY-MM-DD para DD/MM/YYYY
function formatarData(dataIso: string) {
  if (!dataIso) return '';
  const partes = dataIso.split('-');
  if (partes.length !== 3) return dataIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default function AdicionarDependente() {
  const navigate = useNavigate();

  // 1. Inicializa o estado buscando os dependentes salvos no localStorage com segurança
  const [dependentes, setDependentes] = useState<Dependente[]>(() => {
    try {
      const salvo = localStorage.getItem('@EasyVacc:dependentes');
      return salvo ? JSON.parse(salvo) : [];
    } catch (erro) {
      console.error('Erro ao ler o localStorage:', erro);
      return [];
    }
  });

  const [nome, setNome] = useState('');
  const [parentesco, setParentesco] = useState('Filho(a)');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cartaoSus, setCartaoSus] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !dataNascimento) return;

    const novo: Dependente = {
      id: Date.now().toString(),
      nome,
      parentesco,
      dataNascimento,
      cartaoSus: cartaoSus.trim() ? cartaoSus : 'Não informado',
      statusVacinal: 'Em dia',
    };

    const atualizados = [...dependentes, novo];
    
    try {
      // 2. Salva no localStorage para persistir os dados
      localStorage.setItem('@EasyVacc:dependentes', JSON.stringify(atualizados));
      
      // 3. Atualiza o estado local da página
      setDependentes(atualizados);

      // 4. Dispara um evento global para a sidebar e outros componentes atualizarem na hora
      window.dispatchEvent(new CustomEvent('dependenteAdicionado'));

      // Limpa o formulário
      setNome('');
      setParentesco('Filho(a)');
      setDataNascimento('');
      setCartaoSus('');
    } catch (erro) {
      console.error('Erro ao salvar no localStorage:', erro);
      alert('Não foi possível salvar o dependente. Verifique o espaço do navegador.');
    }
  };

  const handleRemove = (id: string) => {
    const atualizados = dependentes.filter((d) => d.id !== id);
    
    try {
      // Atualiza o localStorage e o estado ao remover
      localStorage.setItem('@EasyVacc:dependentes', JSON.stringify(atualizados));
      setDependentes(atualizados);
      
      // Avisa a sidebar que um dependente foi removido
      window.dispatchEvent(new Event('storage'));
    } catch (erro) {
      console.error('Erro ao remover do localStorage:', erro);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 p-6 md:p-10 text-slate-100 antialiased">
      {/* Background Decorativo HealthTech */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/15 via-[#00a884]/20 to-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Link to="/dashboard" className="transition-colors hover:text-white">
                EASYVACC
              </Link>
              <ChevronRight size={12} className="text-slate-500" />
              <span className="text-[#00a884]">DEPENDENTES</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Gestão de Dependentes
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-400">
              Cadastre e acompanhe a situação vacinal da sua família em um só lugar.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-300 shadow-lg backdrop-blur-xl transition-all hover:border-slate-700 hover:text-white active:scale-95"
          >
            <ArrowLeft size={15} />
            Voltar ao Início
          </button>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Formulário */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00a884]/10 border border-[#00a884]/30 text-[#00a884]">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Novo Dependente</h2>
                  <p className="text-xs text-slate-400">Preencha os dados abaixo</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Nome Completo <span className="text-[#00a884]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas Gentil"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all focus:border-[#00a884] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Parentesco
                  </label>
                  <select
                    value={parentesco}
                    onChange={(e) => setParentesco(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white transition-all focus:border-[#00a884] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  >
                    <option value="Filho(a)" className="bg-slate-900 text-white">Filho(a)</option>
                    <option value="Cônjuge" className="bg-slate-900 text-white">Cônjuge</option>
                    <option value="Pai/Mãe" className="bg-slate-900 text-white">Pai/Mãe</option>
                    <option value="Tutelado(a)" className="bg-slate-900 text-white">Tutelado(a)</option>
                    <option value="Outro" className="bg-slate-900 text-white">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Data de Nascimento <span className="text-[#00a884]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white transition-all focus:border-[#00a884] focus:outline-none focus:ring-1 focus:ring-[#00a884] [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Nº Cartão SUS <span className="font-normal text-slate-500">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="000 0000 0000 0000"
                    value={cartaoSus}
                    onChange={(e) => setCartaoSus(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 transition-all focus:border-[#00a884] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00a884] py-3 text-xs font-semibold text-slate-950 shadow-lg shadow-[#00a884]/20 transition-all hover:bg-[#00c49a] active:scale-[0.99]"
                >
                  <UserPlus size={15} />
                  Salvar Dependente
                </button>
              </form>
            </div>
          </div>

          {/* Lista de Dependentes */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Dependentes Cadastrados
              </h2>
              <span className="rounded-full border border-[#00a884]/30 bg-[#00a884]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00a884]">
                {dependentes.length}
              </span>
            </div>

            {dependentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center shadow-xl backdrop-blur-xl">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-500">
                  <User size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-200">Nenhum dependente cadastrado</h3>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  Adicione seus familiares no formulário ao lado para gerenciar as cadernetas de vacinação.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {dependentes.map((dep) => (
                  <div
                    key={dep.id}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition-all hover:border-slate-700 hover:shadow-2xl backdrop-blur-xl"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00a884]/10 border border-[#00a884]/30 text-[#00a884]">
                            <User size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white leading-tight">
                              {dep.nome}
                            </h3>
                            <span className="inline-block mt-0.5 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                              {dep.parentesco}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(dep.id)}
                          className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          title="Remover dependente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Calendar size={13} /> Nascimento:
                          </span>
                          <span className="font-semibold text-slate-200">
                            {formatarData(dep.dataNascimento)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <CreditCard size={13} /> Cartão SUS:
                          </span>
                          <span className="font-semibold text-slate-200">{dep.cartaoSus}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <ShieldCheck size={13} /> Situação:
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-[#00a884]">
                            <CheckCircle2 size={13} /> {dep.statusVacinal}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-800/80 pt-3">
                      <Link
                        to={`/historico?dependenteId=${dep.id}`}
                        className="flex items-center justify-between text-xs font-semibold text-[#00a884] transition-colors hover:text-[#00c49a]"
                      >
                        <span>Ver caderneta completa</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}