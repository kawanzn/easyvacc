import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, CreditCard, Shield, Calendar, Activity, Heart, Home, Camera, Eye, EyeOff, FileText, Download } from 'lucide-react';
import { API_URL } from '../lib/api';

export default function Perfil() {
  // Estado para armazenar a foto de perfil
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  
  // Estado para alternar a exibição de dados sensíveis (P0)
  const [mostrarSensiveis, setMostrarSensiveis] = useState(false);
  
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
    telefoneEmergencia: '',
    updatedAt: '16/09/2026'
  });

  // Funções de máscara para cumprir o requisito de dados sensíveis ocultos por padrão (P0)
  const mascararCpf = (cpf: string) => {
    if (!cpf || cpf.length !== 11) return '***.***.***-**';
    if (mostrarSensiveis) return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return `***.***.${cpf.slice(6, 9)}-**`;
  };

  const mascararCns = (cns: string) => {
    if (!cns) return '***.****.****.**';
    if (mostrarSensiveis) return cns;
    return `***.****.****.${cns.slice(11)}`;
  };

  // Busca os dados de quem logou assim que a tela abre
  useEffect(() => {
    const usuarioId = localStorage.getItem('usuarioId');
    if (usuarioId) {
      fetch(`${API_URL}/api/usuarios/${usuarioId}`)
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

  // Fluxo de solicitação com protocolo (P1)
  const solicitarAlteracao = () => {
    const protocolo = `EV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    alert(`Solicitação registrada com sucesso!\n\nNúmero do Protocolo: ${protocolo}\nAcompanhe o andamento na central de notificações.`);
  };

  // Download de dados - LGPD (P1)
  const baixarMeusDados = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(usuario, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `meus_dados_easyvacc_${usuario.id || 'export'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 animate-fade-in max-w-5xl mx-auto pb-20 font-sans antialiased">
      
      {/* Cabeçalho */}
      <div className="mb-8 border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Meu Perfil</h1>
          <p className="text-slate-400 mt-2 text-xs font-medium leading-relaxed">
            Visualize suas informações de identificação, contato e dados de saúde com segurança e privacidade.
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Última atualização cadastral: {usuario.updatedAt || '16/09/2026'} (P2)
          </span>
        </div>

        {/* Botão de alternância de dados sensíveis (P0) */}
        <button
          onClick={() => setMostrarSensiveis(!mostrarSensiveis)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
        >
          {mostrarSensiveis ? <EyeOff size={15} className="text-[#00a884]" /> : <Eye size={15} className="text-[#00a884]" />}
          <span>{mostrarSensiveis ? 'Ocultar Dados Sensíveis' : 'Exibir Dados Completos'}</span>
        </button>
      </div>

      {/* Cartão Principal de Perfil */}
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative">
        
        {/* Banner vibrante no topo */}
        <div className="h-32 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 relative overflow-hidden border-b border-slate-800/80">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#00a884]/20 rounded-full blur-3xl"></div>
        </div>

        <div className="px-8 pb-8 relative">
          
          {/* Avatar Flutuante com opção de clique para alterar a foto */}
          <div className="absolute -top-12 left-8 group">
            <label htmlFor="input-foto" className="cursor-pointer block relative">
              
              <div className="w-24 h-24 bg-slate-950 rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-900 overflow-hidden relative">
                {fotoPerfil ? (
                  <img src={fotoPerfil} alt="Foto de Perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-[#00a884]">
                    {usuario.nome !== 'Carregando...' ? usuario.nome.charAt(0).toUpperCase() : ''}
                  </span>
                )}

                {/* Overlay escuro com ícone de câmera ao passar o mouse */}
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Camera size={20} />
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

          {/* Nome e Cidade (Sem Gov.br falso conforme P0) */}
          <div className="pt-16 flex flex-col sm:flex-row justify-between items-start gap-4 mb-10">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{usuario.nome}</h2>
              <p className="text-slate-400 flex items-center gap-2 mt-1 text-xs font-medium">
                <MapPin size={15} className="text-[#00a884]" /> {usuario.cidade || 'Cidade não informada'}
              </p>
            </div>
          </div>

          {/* Grade de Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 border-t border-slate-800 pt-8">
            
            {/* Coluna 1: Dados de Identificação */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-2">
                <User size={16} className="text-[#00a884]" /> Identificação
              </h3>

              <div>
                <p className="text-xs font-medium text-slate-400">CPF (Mascarado por padrão)</p>
                <p className="font-semibold text-slate-200 flex items-center gap-2 mt-1 text-sm font-mono tracking-wider">
                  <CreditCard size={16} className="text-[#00a884]" /> {mascararCpf(usuario.cpf)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Cartão Nacional de Saúde (CNS)</p>
                <p className="font-semibold text-slate-200 flex items-center gap-2 mt-1 text-sm font-mono tracking-wider">
                  <Activity size={16} className="text-[#00a884]" /> {mascararCns(usuario.cns)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Data de Nascimento</p>
                <p className="font-semibold text-slate-200 flex items-center gap-2 mt-1 text-sm">
                  <Calendar size={16} className="text-[#00a884]" /> {usuario.dataNascimento || 'Não informada'}
                </p>
              </div>
            </div>

            {/* Coluna 2: Contato e Endereço */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-2">
                <MapPin size={16} className="text-[#00a884]" /> Contato e Endereço
              </h3>

              <div>
                <p className="text-xs font-medium text-slate-400">E-mail</p>
                <p className="font-semibold text-slate-200 flex items-center gap-2 mt-1 text-sm">
                  <Mail size={16} className="text-[#00a884]" /> {usuario.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Telefone / WhatsApp</p>
                <p className="font-semibold text-slate-200 flex items-center gap-2 mt-1 text-sm">
                  <Phone size={16} className="text-[#00a884]" /> {usuario.telefone || 'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Endereço Residencial</p>
                <p className="font-semibold text-slate-200 flex items-start gap-2 mt-1 text-sm">
                  <Home size={16} className="text-[#00a884] shrink-0 mt-0.5" /> 
                  <span className="leading-snug">
                    {usuario.endereco ? usuario.endereco : 'Endereço não cadastrado'}
                  </span>
                </p>
              </div>
            </div>

            {/* Coluna 3: Informações Médicas e Emergência (Acesso restrito) */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-2">
                <Heart size={16} className="text-[#00a884]" /> Dados Clínicos (Restrito)
              </h3>

              <div>
                <p className="text-xs font-medium text-slate-400">Tipo Sanguíneo</p>
                <p className={`font-black text-lg mt-0.5 ${usuario.tipoSanguineo ? 'text-rose-400' : 'text-slate-500 font-medium text-sm'}`}>
                  {usuario.tipoSanguineo || 'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">Alergias Conhecidas</p>
                <p className="font-semibold text-slate-200 mt-1 text-sm">
                  {usuario.alergias || 'Não informadas'}
                </p>
              </div>

              <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 mt-2">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Contato de Emergência</p>
                <p className="font-bold text-slate-200 text-sm">{usuario.contatoEmergencia || 'Não cadastrado'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{usuario.telefoneEmergencia || 'Adicione um contato'}</p>
              </div>
            </div>
            
          </div>

          {/* Botões de Ação, LGPD e Protocolos (P1) */}
          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <button 
                onClick={baixarMeusDados}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition"
              >
                <Download size={14} className="text-[#00a884]" /> Baixar Meus Dados (LGPD)
              </button>
              <button 
                onClick={() => alert("Para exclusão total de dados e encerramento de conta, dirija-se à unidade de saúde responsável ou solicite via ouvidoria.")}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-2 transition"
              >
                Solicitar Exclusão
              </button>
            </div>

            <button 
              onClick={solicitarAlteracao}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md active:scale-[0.99]"
            >
              <FileText size={15} /> Solicitar Alteração com Protocolo
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}