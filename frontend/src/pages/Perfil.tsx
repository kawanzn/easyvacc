import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Activity,
  Heart,
  Home,
  Camera,
  Eye,
  EyeOff,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';

import { supabase } from '../services/supabase';

interface Usuario {
  id: string;
  nome: string;
  cpf: string;
  cns: string;
  email: string;
  telefone: string;
  cidade: string;
  dataNascimento: string;
  endereco: string;
  tipoSanguineo: string;
  alergias: string;
  contatoEmergencia: string;
  telefoneEmergencia: string;
  updatedAt: string;
}

const usuarioInicial: Usuario = {
  id: '',
  nome: '',
  cpf: '',
  cns: '',
  email: '',
  telefone: '',
  cidade: '',
  dataNascimento: '',
  endereco: '',
  tipoSanguineo: '',
  alergias: '',
  contatoEmergencia: '',
  telefoneEmergencia: '',
  updatedAt: '',
};

function formatarData(data?: string | null) {
  if (!data) {
    return '';
  }

  const partes = data.substring(0, 10).split('-');

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default function Perfil() {
  const [fotoPerfil, setFotoPerfil] =
    useState<string | null>(null);

  const [mostrarSensiveis, setMostrarSensiveis] =
    useState(false);

  const [usuario, setUsuario] =
    useState<Usuario>(usuarioInicial);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  // =====================================================
  // CARREGAR PERFIL DO TITULAR
  // =====================================================

  useEffect(() => {
    const carregarPerfil = async () => {
      setCarregando(true);
      setErro('');

      try {
        // ===============================================
        // 1. USUÁRIO AUTENTICADO NO SUPABASE
        // ===============================================

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          setErro(
            'Sua sessão não foi encontrada. Entre novamente.'
          );

          return;
        }

        // ===============================================
        // 2. BUSCAR DADOS NA PUBLIC.USERS
        // ===============================================

        const {
          data,
          error,
        } = await supabase
          .from('users')
          .select(`
            id,
            nome,
            cpf,
            cns,
            email,
            cidade,
            telefone,
            data_nascimento,
            endereco,
            tipo_sanguineo,
            alergias,
            contato_emergencia,
            telefone_emergencia,
            updated_at
          `)
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setErro(
            'Os dados do perfil não foram encontrados.'
          );

          return;
        }

        // ===============================================
        // 3. CONVERTER CAMPOS DO BANCO
        // ===============================================

        setUsuario({
          id: data.id,

          nome:
            data.nome ||
            user.user_metadata?.nome ||
            'Usuário',

          cpf:
            data.cpf || '',

          cns:
            data.cns || '',

          email:
            data.email ||
            user.email ||
            '',

          telefone:
            data.telefone || '',

          cidade:
            data.cidade || '',

          dataNascimento:
            formatarData(
              data.data_nascimento
            ),

          endereco:
            data.endereco || '',

          tipoSanguineo:
            data.tipo_sanguineo || '',

          alergias:
            data.alergias || '',

          contatoEmergencia:
            data.contato_emergencia || '',

          telefoneEmergencia:
            data.telefone_emergencia || '',

          updatedAt:
            formatarData(
              data.updated_at
            ),
        });
      } catch (error: any) {
        console.error(
          'Erro ao carregar perfil no Supabase:',
          error
        );

        setErro(
          error?.message ||
            'Não foi possível carregar seu perfil.'
        );
      } finally {
        setCarregando(false);
      }
    };

    void carregarPerfil();
  }, []);

  // =====================================================
  // CPF
  // =====================================================

  const mascararCpf = (cpf: string) => {
    const numeros =
      (cpf || '').replace(/\D/g, '');

    if (numeros.length !== 11) {
      return '***.***.***-**';
    }

    if (mostrarSensiveis) {
      return numeros.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4'
      );
    }

    return `***.***.${numeros.slice(
      6,
      9
    )}-**`;
  };

  // =====================================================
  // CNS
  // =====================================================

  const mascararCns = (cns: string) => {
    const numeros =
      (cns || '').replace(/\D/g, '');

    if (!numeros) {
      return 'Não informado';
    }

    if (mostrarSensiveis) {
      return numeros;
    }

    return `*** **** **** ${numeros.slice(-4)}`;
  };

  // =====================================================
  // FOTO
  // =====================================================

  const handleMudarFoto = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const arquivo =
      e.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith('image/')) {
      alert(
        'Selecione um arquivo de imagem.'
      );

      return;
    }

    const urlImagem =
      URL.createObjectURL(arquivo);

    setFotoPerfil(urlImagem);
  };

  // =====================================================
  // SOLICITAÇÃO
  // =====================================================

  const solicitarAlteracao = () => {
    const protocolo =
      `EV-${new Date().getFullYear()}-${Math.floor(
        100000 +
          Math.random() * 900000
      )}`;

    alert(
      `Solicitação registrada com sucesso!\n\nNúmero do Protocolo: ${protocolo}\nAcompanhe o andamento na central de notificações.`
    );
  };

  // =====================================================
  // DOWNLOAD LGPD
  // =====================================================

  const baixarMeusDados = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          usuario,
          null,
          2
        )
      );

    const downloadAnchor =
      document.createElement('a');

    downloadAnchor.setAttribute(
      'href',
      dataStr
    );

    downloadAnchor.setAttribute(
      'download',
      `meus_dados_easyvacc_${
        usuario.id || 'export'
      }.json`
    );

    document.body.appendChild(
      downloadAnchor
    );

    downloadAnchor.click();

    downloadAnchor.remove();
  };

  // =====================================================
  // CARREGANDO
  // =====================================================

  if (carregando) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-950 text-slate-100">

        <div className="text-center">

          <Loader2
            size={34}
            className="mx-auto animate-spin text-[#00a884]"
          />

          <p className="mt-4 text-sm font-semibold text-slate-300">
            Carregando seu perfil...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // TELA
  // =====================================================

  return (
    <div className="mx-auto min-h-screen max-w-5xl bg-slate-950 p-4 pb-20 font-sans text-slate-100 antialiased sm:p-8">

      {/* ============================================= */}
      {/* CABEÇALHO */}
      {/* ============================================= */}

      <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-end">

        <div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Meu Perfil
          </h1>

          <p className="mt-2 text-xs font-medium leading-relaxed text-slate-400">
            Visualize suas informações de identificação,
            contato e dados de saúde com segurança e
            privacidade.
          </p>

          <span className="mt-1 block text-[11px] text-slate-500">

            Última atualização cadastral:{' '}

            {usuario.updatedAt ||
              'Não informada'}

          </span>

        </div>

        <button
          type="button"
          onClick={() =>
            setMostrarSensiveis(
              !mostrarSensiveis
            )
          }
          className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900 px-3.5 py-2 text-xs text-slate-300 shadow-sm transition-all hover:bg-slate-800"
        >

          {mostrarSensiveis ? (
            <EyeOff
              size={15}
              className="text-[#00a884]"
            />
          ) : (
            <Eye
              size={15}
              className="text-[#00a884]"
            />
          )}

          <span>

            {mostrarSensiveis
              ? 'Ocultar Dados Sensíveis'
              : 'Exibir Dados Completos'}

          </span>

        </button>

      </div>

      {/* ============================================= */}
      {/* ERRO */}
      {/* ============================================= */}

      {erro && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
          {erro}
        </div>
      )}

      {/* ============================================= */}
      {/* CARD PRINCIPAL */}
      {/* ============================================= */}

      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">

        {/* Banner */}

        <div className="relative h-32 overflow-hidden border-b border-slate-800/80 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950">

          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#00a884]/20 blur-3xl" />

        </div>

        <div className="relative px-8 pb-8">

          {/* ========================================= */}
          {/* AVATAR */}
          {/* ========================================= */}

          <div className="group absolute -top-12 left-8">

            <label
              htmlFor="input-foto"
              className="relative block cursor-pointer"
            >

              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-900 bg-slate-950 shadow-2xl">

                {fotoPerfil ? (

                  <img
                    src={fotoPerfil}
                    alt="Foto de Perfil"
                    className="h-full w-full object-cover"
                  />

                ) : (

                  <span className="text-3xl font-black text-[#00a884]">

                    {usuario.nome
                      ? usuario.nome
                          .charAt(0)
                          .toUpperCase()
                      : '?'}

                  </span>

                )}

                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 text-white opacity-0 transition-opacity group-hover:opacity-100">

                  <Camera size={20} />

                  <span className="mt-0.5 text-[10px] font-bold">
                    Editar
                  </span>

                </div>

              </div>

            </label>

            <input
              type="file"
              id="input-foto"
              accept="image/*"
              className="hidden"
              onChange={handleMudarFoto}
            />

          </div>

          {/* ========================================= */}
          {/* NOME */}
          {/* ========================================= */}

          <div className="mb-10 flex flex-col items-start justify-between gap-4 pt-16 sm:flex-row">

            <div>

              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                {usuario.nome ||
                  'Usuário'}
              </h2>

              <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">

                <MapPin
                  size={15}
                  className="text-[#00a884]"
                />

                {usuario.cidade ||
                  'Cidade não informada'}

              </p>

            </div>

          </div>

          {/* ========================================= */}
          {/* INFORMAÇÕES */}
          {/* ========================================= */}

          <div className="grid grid-cols-1 gap-10 border-t border-slate-800 pt-8 md:grid-cols-2 lg:grid-cols-3">

            {/* IDENTIFICAÇÃO */}

            <div className="space-y-6">

              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">

                <User
                  size={16}
                  className="text-[#00a884]"
                />

                Identificação

              </h3>

              <div>

                <p className="text-xs font-medium text-slate-400">
                  CPF
                </p>

                <p className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold tracking-wider text-slate-200">

                  <CreditCard
                    size={16}
                    className="text-[#00a884]"
                  />

                  {mascararCpf(
                    usuario.cpf
                  )}

                </p>

              </div>

              <div>

                <p className="text-xs font-medium text-slate-400">
                  Cartão Nacional de Saúde (CNS)
                </p>

                <p className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold tracking-wider text-slate-200">

                  <Activity
                    size={16}
                    className="text-[#00a884]"
                  />

                  {mascararCns(
                    usuario.cns
                  )}

                </p>

              </div>

              <div>

                <p className="text-xs font-medium text-slate-400">
                  Data de Nascimento
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-200">

                  <Calendar
                    size={16}
                    className="text-[#00a884]"
                  />

                  {usuario.dataNascimento ||
                    'Não informada'}

                </p>

              </div>

            </div>

            {/* CONTATO */}

            <div className="space-y-6">

              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">

                <MapPin
                  size={16}
                  className="text-[#00a884]"
                />

                Contato e Endereço

              </h3>

              <div>

                <p className="text-xs font-medium text-slate-400">
                  E-mail
                </p>

                <p className="mt-1 flex items-center gap-2 break-all text-sm font-semibold text-slate-200">

                  <Mail
                    size={16}
                    className="shrink-0 text-[#00a884]"
                  />

                  {usuario.email ||
                    'Não informado'}

                </p>

              </div>

              <div>

                <p className="text-xs font-medium text-slate-400">
                  Telefone / WhatsApp
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-200">

                  <Phone
                    size={16}
                    className="text-[#00a884]"
                  />

                  {usuario.telefone ||
                    'Não informado'}

                </p>

              </div>

              <div>

                <p className="text-xs font-medium text-slate-400">
                  Endereço Residencial
                </p>

                <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-slate-200">

                  <Home
                    size={16}
                    className="mt-0.5 shrink-0 text-[#00a884]"
                  />

                  <span className="leading-snug">

                    {usuario.endereco ||
                      'Endereço não cadastrado'}

                  </span>

                </p>

              </div>

            </div>

            {/* DADOS CLÍNICOS */}

            <div className="space-y-6">

              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">

                <Heart
                  size={16}
                  className="text-[#00a884]"
                />

                Dados Clínicos (Restrito)

              </h3>

              <div>

                <p className="text-xs font-medium text-slate-400">
                  Tipo Sanguíneo
                </p>

                <p
                  className={`mt-0.5 ${
                    usuario.tipoSanguineo
                      ? 'text-lg font-black text-rose-400'
                      : 'text-sm font-medium text-slate-500'
                  }`}
                >

                  {usuario.tipoSanguineo ||
                    'Não informado'}

                </p>

              </div>

              <div>

                <p className="text-xs font-medium text-slate-400">
                  Alergias Conhecidas
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-200">

                  {usuario.alergias ||
                    'Não informadas'}

                </p>

              </div>

              <div className="mt-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">

                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Contato de Emergência
                </p>

                <p className="text-sm font-bold text-slate-200">

                  {usuario.contatoEmergencia ||
                    'Não cadastrado'}

                </p>

                <p className="mt-0.5 text-xs text-slate-400">

                  {usuario.telefoneEmergencia ||
                    'Adicione um contato'}

                </p>

              </div>

            </div>

          </div>

          {/* ========================================= */}
          {/* AÇÕES */}
          {/* ========================================= */}

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">

            <div className="flex w-full flex-wrap gap-3 sm:w-auto">

              <button
                type="button"
                onClick={baixarMeusDados}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              >

                <Download
                  size={14}
                  className="text-[#00a884]"
                />

                Baixar Meus Dados (LGPD)

              </button>

              <button
                type="button"
                onClick={() =>
                  alert(
                    'Para exclusão total de dados e encerramento de conta, solicite o atendimento responsável.'
                  )
                }
                className="px-3 py-2 text-xs font-medium text-rose-400 transition hover:text-rose-300"
              >
                Solicitar Exclusão
              </button>

            </div>

            <button
              type="button"
              onClick={solicitarAlteracao}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-emerald-500 active:scale-[0.99] sm:w-auto"
            >

              <FileText size={15} />

              Solicitar Alteração com Protocolo

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}