import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, CreditCard, Shield, Calendar, Activity, Heart, Home, Camera } from 'lucide-react';

export default function Perfil() {
  // Estado para armazenar a foto de perfil
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  
  // Estado preparado para receber TODAS as colunas do banco
  const [usuario, setUsuario] = useState<any>({
    nome: 'Carregando...',
    cpf: '...',
    cns: '...',
    email: '...',
    telefone: '',
    cidade: 'Carregando...',
    dataNascimento: '',
    endereco: '',
    tipoSanguineo: '',
    alergias: '',
    contatoEmergencia: '',
    telefoneEmergencia: ''
  });

  // Busca os dados de quem logou assim que a tela abre
  useEffect(() => {
    const usuarioId = localStorage.getItem('usuarioId');
    if (usuarioId) {
      fetch(`http://localhost:5000/api/usuarios/${usuarioId}`)
        .then(res => res.json())
        .then(data => {
          if (data.sucesso) {
            setUsuario(data.dados);
          }
        })
        .catch(erro => console.error("Erro ao carregar perfil", erro));
    }
  }, []);

  const handleMudarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      const urlImagem = URL.createObjectURL(arquivo);
      setFotoPerfil(urlImagem);
    }
  };

  return (
    <div className="p-8 animate-fade-in max-w-5xl mx-auto pb-20">
      
      {/* Cabeçalho */}
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-800">Meu Perfil</h1>
        <p className="text-slate-500 mt-2">
          Visualize e gerencie suas informações pessoais, endereço e dados de saúde.
        </p>
      </div>

      {/* Cartão Principal de Perfil */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Banner vibrante no topo */}
        <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="px-8 pb-8 relative">
          
          {/* Avatar Flutuante com opção de clique para alterar a foto */}
          <div className="absolute -top-12 left-8 group">
            <label htmlFor="input-foto" className="cursor-pointer block relative">
              
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white overflow-hidden relative">
                {fotoPerfil ? (
                  <img src={fotoPerfil} alt="Foto de Perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-teal-600">
                    {usuario.nome !== 'Carregando...' ? usuario.nome.charAt(0).toUpperCase() : ''}
                  </span>
                )}

                {/* Overlay escuro com ícone de câmera ao passar o mouse */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Camera size={24} />
                  <span className="text-[10px] font-bold mt-0.5">Editar</span>
                </div>
              </div>

            </label>

            {/* Input de arquivo escondido */}
            <input 
              type="file" 
              id="input-foto" 
              accept="image/*" 
              className="hidden" 
              onChange={handleMudarFoto}
            />
          </div>

          {/* Nome e Selo */}
          <div className="pt-16 flex justify-between items-start mb-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{usuario.nome}</h2>
              <p className="text-slate-500 flex items-center gap-2 mt-1">
                <MapPin size={16} /> {usuario.cidade || 'Cidade não informada'}
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-100">
              <Shield size={14} /> Cadastro Validado (Gov.br)
            </span>
          </div>

          {/* Grade de Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 border-t border-slate-100 pt-8">
            
            {/* Coluna 1: Dados de Identificação */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                <User size={16} /> Identificação
              </h3>

              <div>
                <p className="text-sm text-slate-500">CPF</p>
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  <CreditCard size={16} className="text-teal-500" /> {usuario.cpf}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Cartão Nacional de Saúde (CNS)</p>
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  <Activity size={16} className="text-teal-500" /> {usuario.cns}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Data de Nascimento</p>
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  <Calendar size={16} className="text-teal-500" /> {usuario.dataNascimento || 'Não informada'}
                </p>
              </div>
            </div>

            {/* Coluna 2: Contato e Endereço */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                <MapPin size={16} /> Contato e Endereço
              </h3>

              <div>
                <p className="text-sm text-slate-500">E-mail</p>
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  <Mail size={16} className="text-teal-500" /> {usuario.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Telefone / WhatsApp</p>
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  <Phone size={16} className="text-teal-500" /> {usuario.telefone || 'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Endereço Residencial</p>
                <p className="font-medium text-slate-800 flex items-start gap-2">
                  <Home size={16} className="text-teal-500 shrink-0 mt-0.5" /> 
                  <span className="leading-snug">
                    {usuario.endereco ? usuario.endereco : 'Endereço não cadastrado'}
                  </span>
                </p>
              </div>
            </div>

            {/* Coluna 3: Informações Médicas e Emergência */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                <Heart size={16} /> Dados Clínicos
              </h3>

              <div>
                <p className="text-sm text-slate-500">Tipo Sanguíneo</p>
                <p className={`font-black text-lg ${usuario.tipoSanguineo ? 'text-rose-600' : 'text-slate-400 font-medium text-sm'}`}>
                  {usuario.tipoSanguineo || 'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Alergias Conhecidas</p>
                <p className="font-medium text-slate-800">
                  {usuario.alergias || 'Não informadas'}
                </p>
              </div>

              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 mt-2">
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">Contato de Emergência</p>
                <p className="font-bold text-slate-800">{usuario.contatoEmergencia || 'Não cadastrado'}</p>
                <p className="text-sm text-slate-600">{usuario.telefoneEmergencia || 'Adicione um contato'}</p>
              </div>
            </div>
            
          </div>

          {/* Botão de Ação */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => alert("Solicitação de alteração enviada com sucesso!")}
              className="bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Solicitar Alteração de Dados
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}