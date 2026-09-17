import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../lib/api'; // Ajuste o caminho se necessário para o seu arquivo de config da API

interface Dependente {
  id: number;
  nome: string;
  parentesco: string;
  dataNascimento: string;
  cns?: string;
  statusVacinal: string;
}

export default function Dependentes() {
  const [dependentes, setDependentes] = useState<Dependente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [novoDependente, setNovoDependente] = useState({
    nome: '',
    parentesco: 'Filho(a)',
    dataNascimento: '',
    cns: '',
  });

  // Função para buscar os dependentes reais da API do Laravel
  const carregarDependentes = async () => {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
      setCarregando(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/dependentes/${usuarioId}`);
      const data = await response.json();
      if (data.sucesso && data.dados) {
        // Mapeia os dados adaptando para a interface da tela
        const formatados = data.dados.map((d: any) => ({
          id: d.id,
          nome: d.nome,
          parentesco: d.parentesco || 'Outro',
          dataNascimento: d.dataNascimento ? d.dataNascimento.split('-').reverse().join('/') : '',
          cns: d.cns || 'Não informado',
          statusVacinal: 'Em dia',
        }));
        setDependentes(formatados);
      }
    } catch (err) {
      console.error('Erro ao buscar dependentes:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDependentes();
  }, []);

  const handleAddDependente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // Validação P2: Data de nascimento não pode ser futura
    const dataAtual = new Date().toISOString().split('T')[0];
    if (novoDependente.dataNascimento > dataAtual) {
      setErro('A data de nascimento não pode ser uma data futura.');
      return;
    }

    // Validação P2: Se o CNS/Cartão SUS for preenchido, deve ter exatamente 15 dígitos
    if (novoDependente.cns && !/^\d{15}$/.test(novoDependente.cns.replace(/\D/g, ''))) {
      setErro('O número do Cartão SUS (CNS) deve conter exatamente 15 dígitos numéricos.');
      return;
    }

    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
      setErro('Usuário não autenticado.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/dependentes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: Number(usuarioId),
          nome: novoDependente.nome,
          parentesco: novoDependente.parentesco,
          dataNascimento: novoDependente.dataNascimento,
          cns: novoDependente.cns ? novoDependente.cns.replace(/\D/g, '') : null,
        }),
      });

      const data = await response.json();

      if (data.sucesso) {
        setIsModalOpen(false);
        setNovoDependente({ nome: '', parentesco: 'Filho(a)', dataNascimento: '', cns: '' });
        carregarDependentes(); // Recarrega a lista direto da API
      } else {
        setErro(data.mensagem || 'Erro ao cadastrar dependente.');
      }
    } catch (err) {
      console.error('Erro na requisição:', err);
      setErro('Erro de conexão com o servidor.');
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm('Tem certeza de que deseja remover este dependente?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/dependentes/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.sucesso) {
        setDependentes(dependentes.filter((d) => d.id !== id));
      } else {
        alert(data.mensagem || 'Erro ao remover dependente.');
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro de conexão ao tentar remover.');
    }
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
        {/* Cabeçalho */}
        <header className="mb-8 border-b border-slate-200 pb-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <Link to="/dashboard" className="hover:text-slate-800">
              EasyVacc
            </Link>
            <ChevronRight size={13} />
            <span className="text-slate-700">Dependentes</span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-[34px]">
                Gestão de Dependentes
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Cadastre e acompanhe as cadernetas de vacinação da sua família.
              </p>
            </div>

            <button
              onClick={() => {
                setErro('');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <UserPlus size={16} />
              Adicionar dependente
            </button>
          </div>
        </header>

        {/* Lista de Dependentes */}
        {carregando ? (
          <div className="py-12 text-center text-sm text-slate-500">Carregando dependentes...</div>
        ) : dependentes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <User size={24} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Nenhum dependente cadastrado</h3>
            <p className="mt-1 text-xs text-slate-500">
              Adicione filhos ou outros dependentes para gerenciar a imunização deles.
            </p>
            <button
              onClick={() => {
                setErro('');
                setIsModalOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Plus size={14} />
              Cadastrar Primeiro Dependente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dependentes.map((dep) => (
              <div
                key={dep.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{dep.nome}</h3>
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {dep.parentesco}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(dep.id)}
                      className="text-slate-400 transition-colors hover:text-red-600"
                      title="Remover dependente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Nascimento:</span>
                      <span className="font-medium text-slate-700">{dep.dataNascimento}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cartão SUS:</span>
                      <span className="font-medium text-slate-700">{dep.cns}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Situação Vacinal:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <ShieldCheck size={14} /> {dep.statusVacinal}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-3">
                  <Link
                    to={`/historico?dependenteId=${dep.id}`}
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-950"
                  >
                    <span>Ver caderneta do dependente</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Cadastro */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Novo Dependente</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {erro && (
                <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                  {erro}
                </div>
              )}

              <form onSubmit={handleAddDependente} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas Sampaio"
                    value={novoDependente.nome}
                    onChange={(e) => setNovoDependente({ ...novoDependente, nome: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Parentesco
                  </label>
                  <select
                    value={novoDependente.parentesco}
                    onChange={(e) => setNovoDependente({ ...novoDependente, parentesco: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                  >
                    <option value="Filho(a)">Filho(a)</option>
                    <option value="Cônjuge">Cônjuge</option>
                    <option value="Pai/Mãe">Pai/Mãe</option>
                    <option value="Tutelado(a)">Tutelado(a)</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]} // Impede seleção de datas futuras nativamente no input
                    value={novoDependente.dataNascimento}
                    onChange={(e) => setNovoDependente({ ...novoDependente, dataNascimento: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Número do Cartão SUS (CNS - 15 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="Ex: 700000000000001"
                    value={novoDependente.cns}
                    onChange={(e) => setNovoDependente({ ...novoDependente, cns: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Salvar Dependente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}