import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  Mail,
  BellRing,
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
  Pencil,
  Save,
  X,
  CheckCircle,
  Fingerprint,
  Trash2,
  Accessibility,
  Volume2,
  Square,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { passkeysDisponiveis, mensagemErroPasskey } from '../lib/passkeys';
import { jsPDF } from 'jspdf';
interface PasskeyRegistrada {
  id: string;
  friendly_name?: string | null;
  created_at: string;
  last_used_at?: string | null;
}

interface Usuario {
  id: string;
  avatarPath: string;
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
interface FormularioPerfil {
  telefone: string;
  endereco: string;
  tipoSanguineo: string;
  alergias: string;
  contatoEmergencia: string;
  telefoneEmergencia: string;
}
const usuarioInicial: Usuario = {
  id: '',
  avatarPath: '',
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
const formularioInicial: FormularioPerfil = {
  telefone: '',
  endereco: '',
  tipoSanguineo: '',
  alergias: '',
  contatoEmergencia: '',
  telefoneEmergencia: '',
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
  const [enviandoFoto, setEnviandoFoto] =
    useState(false);
  const [mostrarSensiveis, setMostrarSensiveis] =
    useState(false);
  const [usuario, setUsuario] =
    useState<Usuario>(usuarioInicial);
  const [formulario, setFormulario] =
    useState<FormularioPerfil>(formularioInicial);
  const [carregando, setCarregando] =
    useState(true);
  const [salvando, setSalvando] =
    useState(false);
  const [exportandoDados, setExportandoDados] =
    useState(false);
  const [editando, setEditando] =
    useState(false);
  const [erro, setErro] =
    useState('');
  const [sucesso, setSucesso] =
    useState('');
  const [modalReautenticacao, setModalReautenticacao] = useState(false);
  const [senhaReautenticacao, setSenhaReautenticacao] = useState('');
  const [validandoSenha, setValidandoSenha] = useState(false);
  const [mostrarSenhaReautenticacao, setMostrarSenhaReautenticacao] = useState(false);
  const [gerandoAutorizacao, setGerandoAutorizacao] = useState(false);
  const [codigoAutorizacao, setCodigoAutorizacao] = useState('');
  const [expiraAutorizacao, setExpiraAutorizacao] = useState('');
  const [modalExclusao, setModalExclusao] = useState(false);
  const [solicitandoExclusao, setSolicitandoExclusao] = useState(false);
  const [statusExclusao, setStatusExclusao] = useState('');
  const [passkeys, setPasskeys] = useState<PasskeyRegistrada[]>([]);
  const [carregandoPasskeys, setCarregandoPasskeys] = useState(false);
  const [salvandoPasskey, setSalvandoPasskey] = useState(false);
  const [removendoPasskey, setRemovendoPasskey] = useState<string | null>(null);
  const [erroPasskey, setErroPasskey] = useState('');
  const [sucessoPasskey, setSucessoPasskey] = useState('');
  const [emailAlertaAtivo, setEmailAlertaAtivo] = useState(false);
  const [carregandoPreferencia, setCarregandoPreferencia] = useState(true);
  const [salvandoPreferencia, setSalvandoPreferencia] = useState(false);
  const [erroPreferencia, setErroPreferencia] = useState('');
  const [preferenciaDisponivel, setPreferenciaDisponivel] = useState(false);
  const [sucessoPreferencia, setSucessoPreferencia] = useState('');
  // Preferências de acessibilidade locais: não armazenam dados de saúde.
  const [acessibilidade, setAcessibilidade] = useState(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem('easyvacc-acessibilidade') || '{}');
      return {
        ativo: salvo.ativo === true,
        fonte: ['normal', 'grande', 'extra'].includes(salvo.fonte) ? salvo.fonte as 'normal' | 'grande' | 'extra' : 'normal' as const,
        contraste: salvo.contraste === true,
      };
    } catch {
      return { ativo: false, fonte: 'normal' as const, contraste: false };
    }
  });
  const [lendoAcessibilidade, setLendoAcessibilidade] = useState(false);

  useEffect(() => {
    localStorage.setItem('easyvacc-acessibilidade', JSON.stringify(acessibilidade));
    const raiz = document.documentElement;
    raiz.classList.toggle('ev-acessivel', acessibilidade.ativo);
    raiz.classList.toggle('ev-acessivel-contraste', acessibilidade.ativo && acessibilidade.contraste);
    raiz.dataset.evFonte = acessibilidade.ativo ? acessibilidade.fonte : 'normal';
    // Estilos dos controles do Perfil; o Layout aplica as preferências às demais páginas.
    const id = 'easyvacc-estilos-acessibilidade';
    {
      let estilo = document.getElementById(id) as HTMLStyleElement | null;
      if (!estilo) { estilo = document.createElement('style'); estilo.id = id; document.head.appendChild(estilo); }
      estilo.textContent = `
        html.ev-acessivel .ev-page :is(button,a,input,select,textarea):focus-visible { outline: 3px solid #60a5fa !important; outline-offset: 3px; }
        /* Contraste aplicado apenas quando solicitado e respeitando o tema da aplicação. */
        html.ev-acessivel-contraste .easyvacc-app:not(.easyvacc-light) .ev-page :is(.text-slate-400,.text-slate-500,.text-slate-600,.text-slate-300) { color: #ffffff !important; }
        html.ev-acessivel-contraste .easyvacc-app.easyvacc-light .ev-page :is(.text-slate-400,.text-slate-500,.text-slate-600,.text-slate-300) { color: #172b4d !important; }
        html.ev-acessivel-contraste .easyvacc-app .ev-page :is(.border-slate-800,.border-slate-700) { border-color: #7891ad !important; }
        html.ev-acessivel-contraste .easyvacc-app .ev-page .ev-a11y-help { font-weight: 600 !important; opacity: 1 !important; }
        html.ev-acessivel-contraste .easyvacc-app:not(.easyvacc-light) .ev-page .ev-a11y-help { color: #ffffff !important; }
        html.ev-acessivel-contraste .easyvacc-app.easyvacc-light .ev-page .ev-a11y-help { color: #172b4d !important; }
        /* Interruptores compactos: não herdam altura mínima nem tamanho de fonte ampliado. */
        html .ev-page button.ev-a11y-toggle { box-sizing:border-box !important; display:inline-flex !important; align-items:center !important; justify-content:flex-start !important; width:46px !important; min-width:46px !important; max-width:46px !important; height:26px !important; min-height:26px !important; max-height:26px !important; padding:3px !important; border:0 !important; border-radius:9999px !important; background:#64748b !important; cursor:pointer; flex:none !important; overflow:hidden; appearance:none; transition:background .2s; }
        html .ev-page button.ev-a11y-toggle[aria-checked="true"] { background:#1677bd !important; }
        html .ev-page button.ev-a11y-toggle > span.ev-a11y-toggle-thumb { box-sizing:border-box !important; display:block !important; width:20px !important; min-width:20px !important; max-width:20px !important; height:20px !important; min-height:20px !important; max-height:20px !important; padding:0 !important; margin:0 !important; border:0 !important; border-radius:50% !important; background:#fff !important; box-shadow:0 1px 3px #0003; transform:translateX(0); transition:transform .2s; }
        html .ev-page button.ev-a11y-toggle[aria-checked="true"] > span.ev-a11y-toggle-thumb { transform:translateX(20px); }
        html .ev-page button.ev-a11y-toggle:focus-visible { outline:3px solid #60a5fa !important; outline-offset:3px; }
        .easyvacc-app.easyvacc-light .ev-a11y-label { color:#152b49 !important; }
        .easyvacc-app.easyvacc-light .ev-a11y-help { color:#475569 !important; }
        @media (prefers-reduced-motion: reduce) { html.ev-acessivel *, html.ev-acessivel *::before, html.ev-acessivel *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `;
    }
    window.dispatchEvent(new CustomEvent('easyvacc-acessibilidade-atualizada', { detail: acessibilidade }));
  }, [acessibilidade]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const lerOrientacoes = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (lendoAcessibilidade) { setLendoAcessibilidade(false); return; }
    const fala = new SpeechSynthesisUtterance('Bem-vindo ao EasyVacc Acessível. Na caderneta, você consulta as vacinas registradas e as datas de retorno. No certificado, encontra seus comprovantes. Em dependentes, acompanha os registros da sua família. Para dúvidas sobre vacinação, procure um profissional de saúde.');
    fala.lang = 'pt-BR';
    fala.rate = 0.9;
    fala.onend = () => setLendoAcessibilidade(false);
    fala.onerror = () => setLendoAcessibilidade(false);
    setLendoAcessibilidade(true);
    window.speechSynthesis.speak(fala);
  };

  // =====================================================
  // CARREGAR PERFIL
  // =====================================================
  useEffect(() => {
    const carregarPerfil = async () => {
      setCarregando(true);
      setErro('');
      try {
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
        const {
          data,
          error,
        } = await supabase
          .from('users')
          .select(`
            id,
            avatar_path,
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
        const perfil: Usuario = {
          id: data.id,
          avatarPath:
            data.avatar_path || '',
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
        };
        setUsuario(perfil);
        // Preferência de lembretes por e-mail (desativada por padrão).
        const { data: preferencia, error: erroConsultaPreferencia } = await supabase
          .from('preferencias_alertas')
          .select('email_ativo')
          .eq('usuario_id', user.id)
          .maybeSingle();
        if (erroConsultaPreferencia) {
          console.error('Erro ao consultar preferência de alertas:', erroConsultaPreferencia);
          setErroPreferencia('Não foi possível carregar sua preferência de e-mail. Reabra o perfil para tentar novamente.');
          setPreferenciaDisponivel(false);
        } else {
          setEmailAlertaAtivo(preferencia?.email_ativo === true);
          setPreferenciaDisponivel(true);
          setErroPreferencia('');
        }
        setCarregandoPreferencia(false);
        const { data: solicitacaoExclusao, error: erroSolicitacaoExclusao } = await supabase
          .from('solicitacoes_exclusao')
          .select('status')
          .eq('usuario_id', user.id)
          .in('status', ['pendente', 'em_analise'])
          .maybeSingle();
        if (erroSolicitacaoExclusao) {
          console.error('Erro ao consultar solicitação de exclusão:', erroSolicitacaoExclusao);
        } else {
          setStatusExclusao(solicitacaoExclusao?.status || '');
        }
        if (perfil.avatarPath) {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from('avatars')
              .createSignedUrl(perfil.avatarPath, 60 * 60);
          if (signedError) {
            console.error('Erro ao carregar foto de perfil:', signedError);
            setFotoPerfil(null);
          } else {
            setFotoPerfil(signedData.signedUrl);
          }
        } else {
          setFotoPerfil(null);
        }
        setFormulario({
          telefone: perfil.telefone,
          endereco: perfil.endereco,
          tipoSanguineo:
            perfil.tipoSanguineo,
          alergias: perfil.alergias,
          contatoEmergencia:
            perfil.contatoEmergencia,
          telefoneEmergencia:
            perfil.telefoneEmergencia,
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
        setCarregandoPreferencia(false);
        setCarregando(false);
      }
    };
    void carregarPerfil();
  }, []);
  const alterarPreferenciaEmail = async (ativar: boolean) => {
    if (salvandoPreferencia || carregandoPreferencia || !usuario.id) return;
    setSalvandoPreferencia(true);
    setErroPreferencia('');
    setSucessoPreferencia('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.id !== usuario.id) {
        throw new Error('Sua sessão expirou. Entre novamente para continuar.');
      }
      const { error } = await supabase
        .from('preferencias_alertas')
        .upsert({
          usuario_id: user.id,
          email_ativo: ativar,
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'usuario_id' });
      if (error) throw error;
      setEmailAlertaAtivo(ativar);
      setSucessoPreferencia(ativar
        ? 'Lembretes por e-mail ativados com sucesso.'
        : 'Lembretes por e-mail desativados com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar preferência de e-mail:', error);
      setErroPreferencia('Não foi possível salvar sua escolha. Tente novamente.');
    } finally {
      setSalvandoPreferencia(false);
    }
  };

  // =====================================================
  // PASSKEYS / BIOMETRIA
  // =====================================================
  useEffect(() => {
    if (!usuario.id || !passkeysDisponiveis()) return;
    let ativo = true;

    const carregarPasskeys = async () => {
      setCarregandoPasskeys(true);
      try {
        const { data, error } = await supabase.auth.passkey.list();
        if (error) throw error;
        if (ativo) setPasskeys(data ?? []);
      } catch (error) {
        if (ativo) setErroPasskey(mensagemErroPasskey(error, 'Não foi possível consultar os dispositivos cadastrados.'));
      } finally {
        if (ativo) setCarregandoPasskeys(false);
      }
    };

    void carregarPasskeys();
    return () => { ativo = false; };
  }, [usuario.id]);

  const cadastrarPasskey = async () => {
    if (salvandoPasskey || !passkeysDisponiveis()) return;
    setErroPasskey('');
    setSucessoPasskey('');
    setSalvandoPasskey(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.id !== usuario.id) {
        throw new Error('Sua sessão expirou. Entre novamente antes de cadastrar a biometria.');
      }
      const { error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      setSucessoPasskey('Biometria cadastrada! No próximo acesso, use Entrar com biometria.');
      const { data: lista, error: erroLista } = await supabase.auth.passkey.list();
      if (erroLista) {
        setErroPasskey('A biometria foi cadastrada, mas não foi possível atualizar a lista. Reabra o Perfil.');
      } else {
        setPasskeys(lista ?? []);
      }
    } catch (error) {
      console.error('Erro ao cadastrar Passkey:', error);
      setErroPasskey(mensagemErroPasskey(error, 'Não foi possível cadastrar a biometria.'));
    } finally {
      setSalvandoPasskey(false);
    }
  };

  const removerPasskey = async (passkey: PasskeyRegistrada) => {
    if (removendoPasskey || salvandoPasskey) return;
    const nome = passkey.friendly_name || 'este dispositivo';
    if (!window.confirm(`Remover a biometria de ${nome}? Ela deixará de funcionar para entrar na sua conta.`)) return;
    setErroPasskey('');
    setSucessoPasskey('');
    setRemovendoPasskey(passkey.id);
    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId: passkey.id });
      if (error) throw error;
      setPasskeys((anteriores) => anteriores.filter((item) => item.id !== passkey.id));
      setSucessoPasskey('Dispositivo removido com sucesso.');
    } catch (error) {
      console.error('Erro ao remover Passkey:', error);
      setErroPasskey(mensagemErroPasskey(error, 'Não foi possível remover o dispositivo.'));
    } finally {
      setRemovendoPasskey(null);
    }
  };

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
  // REAUTENTICAÇÃO PARA DADOS SENSÍVEIS
  // =====================================================
  const solicitarExibicaoDadosSensiveis = () => {
    setErro('');
    setSucesso('');
    if (mostrarSensiveis) {
      setMostrarSensiveis(false);
      return;
    }
    setSenhaReautenticacao('');
    setMostrarSenhaReautenticacao(false);
    setModalReautenticacao(true);
  };
  const fecharReautenticacao = () => {
    if (validandoSenha) return;
    setModalReautenticacao(false);
    setSenhaReautenticacao('');
    setMostrarSenhaReautenticacao(false);
  };
  const confirmarReautenticacao = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!senhaReautenticacao) {
      setErro('Informe sua senha para visualizar os dados completos.');
      return;
    }
    setValidandoSenha(true);
    setErro('');
    setSucesso('');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        setErro('Sua sessão expirou. Entre novamente para continuar.');
        return;
      }
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaReautenticacao,
      });
      if (loginError) {
        setErro('Senha incorreta. Os dados continuam protegidos.');
        return;
      }
      setMostrarSensiveis(true);
      setModalReautenticacao(false);
      setSenhaReautenticacao('');
      setMostrarSenhaReautenticacao(false);
      setSucesso('Identidade confirmada. Dados completos liberados temporariamente.');
    } catch (error) {
      console.error('Erro ao reautenticar:', error);
      setErro('Não foi possível confirmar sua identidade. Tente novamente.');
    } finally {
      setValidandoSenha(false);
    }
  };
  // =====================================================
  // FOTO
  // =====================================================
  const handleMudarFoto = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setErro('');
    setSucesso('');
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(arquivo.type)) {
      setErro('Use uma imagem JPG, PNG ou WEBP.');
      return;
    }
    const tamanhoMaximo = 5 * 1024 * 1024;
    if (arquivo.size > tamanhoMaximo) {
      setErro('A foto deve ter no máximo 5 MB.');
      return;
    }
    setEnviandoFoto(true);
    try {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();
      if (authError || !user) {
        setErro('Sua sessão expirou. Entre novamente para alterar a foto.');
        return;
      }
      const extensao =
        arquivo.type === 'image/png'
          ? 'png'
          : arquivo.type === 'image/webp'
            ? 'webp'
            : 'jpg';
      const caminhoNovo = `${user.id}/avatar.${extensao}`;
      const caminhoAnterior = usuario.avatarPath;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(caminhoNovo, arquivo, {
          cacheControl: '3600',
          upsert: true,
          contentType: arquivo.type,
        });
      if (uploadError) throw uploadError;
      const agora = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar_path: caminhoNovo,
          updated_at: agora,
        })
        .eq('id', user.id);
      if (updateError) {
        if (caminhoNovo !== caminhoAnterior) {
          await supabase.storage.from('avatars').remove([caminhoNovo]);
        }
        throw updateError;
      }
      if (caminhoAnterior && caminhoAnterior !== caminhoNovo) {
        const { error: removeError } = await supabase.storage
          .from('avatars')
          .remove([caminhoAnterior]);
        if (removeError) {
          console.warn('Não foi possível remover o avatar anterior:', removeError);
        }
      }
      const { data: signedData, error: signedError } =
        await supabase.storage
          .from('avatars')
          .createSignedUrl(caminhoNovo, 60 * 60);
      if (signedError) throw signedError;
      setFotoPerfil(signedData.signedUrl);
      setUsuario((anterior) => ({
        ...anterior,
        avatarPath: caminhoNovo,
        updatedAt: formatarData(agora),
      }));
      setSucesso('Foto de perfil atualizada com sucesso.');
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      setErro('Não foi possível salvar sua foto. Tente novamente.');
    } finally {
      setEnviandoFoto(false);
    }
  };
  // =====================================================
  // FORMULÁRIO
  // =====================================================
  const alterarCampo = (
    campo: keyof FormularioPerfil,
    valor: string
  ) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };
  const iniciarEdicao = () => {
    setFormulario({
      telefone:
        usuario.telefone || '',
      endereco:
        usuario.endereco || '',
      tipoSanguineo:
        usuario.tipoSanguineo || '',
      alergias:
        usuario.alergias || '',
      contatoEmergencia:
        usuario.contatoEmergencia || '',
      telefoneEmergencia:
        usuario.telefoneEmergencia || '',
    });
    setErro('');
    setSucesso('');
    setEditando(true);
  };
  const cancelarEdicao = () => {
    setFormulario({
      telefone:
        usuario.telefone || '',
      endereco:
        usuario.endereco || '',
      tipoSanguineo:
        usuario.tipoSanguineo || '',
      alergias:
        usuario.alergias || '',
      contatoEmergencia:
        usuario.contatoEmergencia || '',
      telefoneEmergencia:
        usuario.telefoneEmergencia || '',
    });
    setErro('');
    setSucesso('');
    setEditando(false);
  };
  // =====================================================
  // SALVAR PERFIL
  // =====================================================
  const salvarAlteracoes = async () => {
    if (salvando) {
      return;
    }
    setSalvando(true);
    setErro('');
    setSucesso('');
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        setErro(
          'Sua sessão expirou. Entre novamente para continuar.'
        );
        return;
      }
      const telefone =
        formulario.telefone.trim();
      const endereco =
        formulario.endereco.trim();
      const alergias =
        formulario.alergias.trim();
      const contatoEmergencia =
        formulario.contatoEmergencia.trim();
      const telefoneEmergencia =
        formulario.telefoneEmergencia.trim();
      const agora =
        new Date().toISOString();
      const { error } = await supabase
        .from('users')
        .update({
          telefone:
            telefone || null,
          endereco:
            endereco || null,
          tipo_sanguineo:
            formulario.tipoSanguineo ||
            null,
          alergias:
            alergias || null,
          contato_emergencia:
            contatoEmergencia || null,
          telefone_emergencia:
            telefoneEmergencia || null,
          updated_at:
            agora,
        })
        .eq('id', user.id);
      if (error) {
        throw error;
      }
      setUsuario((anterior) => ({
        ...anterior,
        telefone,
        endereco,
        tipoSanguineo:
          formulario.tipoSanguineo,
        alergias,
        contatoEmergencia,
        telefoneEmergencia,
        updatedAt:
          formatarData(agora),
      }));
      setEditando(false);
      setSucesso(
        'Informações atualizadas com sucesso.'
      );
    } catch (error) {
      console.error(
        'Erro ao atualizar perfil:',
        error
      );
      setErro(
        'Não foi possível salvar suas informações. Tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  };
  // =====================================================
  // EXPORTAÇÃO DE DADOS - LGPD
  // =====================================================
  const coletarDadosLgpd = async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Sua sessão expirou. Entre novamente para baixar seus dados.');
    }
    const [dependentesRes, vacinasRes, certificadosRes, notificacoesRes] =
      await Promise.all([
        supabase
          .from('dependentes')
          .select('nome, parentesco, data_nascimento, cns, created_at, updated_at')
          .eq('usuario_id', user.id),
        supabase
          .from('vacinas')
          .select('nome, data_aplicacao, lote, fabricante, proxima_dose, posto, profissional, status, motivo_correcao, dependente_id, registrado_em, atualizado_em')
          .eq('usuario_id', user.id),
        supabase
          .from('certificados')
          .select('codigo, dependente_id, emitido_em, valido, status, versao, revogado_em, motivo_revogacao')
          .eq('usuario_id', user.id),
        supabase
          .from('notificacoes')
          .select('*')
          .eq('usuario_id', user.id),
      ]);
    const primeiroErro =
      dependentesRes.error ||
      vacinasRes.error ||
      certificadosRes.error ||
      notificacoesRes.error;
    if (primeiroErro) throw primeiroErro;
    return {
      exportadoEm: new Date().toISOString(),
      observacao:
        'Cópia dos dados pessoais disponíveis na conta EasyVacc. Este arquivo não substitui documentos oficiais do SUS.',
      perfil: {
        nome: usuario.nome,
        cpf: usuario.cpf,
        cns: usuario.cns || null,
        email: usuario.email,
        telefone: usuario.telefone || null,
        cidade: usuario.cidade || null,
        dataNascimento: usuario.dataNascimento || null,
        endereco: usuario.endereco || null,
        tipoSanguineo: usuario.tipoSanguineo || null,
        alergias: usuario.alergias || null,
        contatoEmergencia: usuario.contatoEmergencia || null,
        telefoneEmergencia: usuario.telefoneEmergencia || null,
        ultimaAtualizacao: usuario.updatedAt || null,
      },
      dependentes: dependentesRes.data || [],
      vacinas: vacinasRes.data || [],
      certificados: certificadosRes.data || [],
      notificacoes: notificacoesRes.data || [],
    };
  };
  const baixarDadosJson = async () => {
    if (exportandoDados) return;
    setExportandoDados(true);
    setErro('');
    setSucesso('');
    try {
      const dados = await coletarDadosLgpd();
      const blob = new Blob([JSON.stringify(dados, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meus_dados_easyvacc_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSucesso('Seus dados foram preparados em JSON.');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível baixar seus dados.'
      );
    } finally {
      setExportandoDados(false);
    }
  };
  const baixarDadosPdf = async () => {
    if (exportandoDados) return;
    setExportandoDados(true);
    setErro('');
    setSucesso('');
    try {
      const dados = await coletarDadosLgpd();
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const margem = 15;
      const largura = 180;
      let y = 18;
      const novaPaginaSePreciso = (altura = 8) => {
        if (y + altura > 282) {
          doc.addPage();
          y = 18;
        }
      };
      const titulo = (texto: string) => {
        novaPaginaSePreciso(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(texto, margem, y);
        y += 8;
      };
      const linha = (rotulo: string, valor: unknown) => {
        novaPaginaSePreciso(8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const texto = `${rotulo}: ${valor === null || valor === undefined || valor === '' ? 'Não informado' : String(valor)}`;
        const linhas = doc.splitTextToSize(texto, largura);
        novaPaginaSePreciso(linhas.length * 5);
        doc.text(linhas, margem, y);
        y += linhas.length * 5 + 1;
      };
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('EasyVacc - Cópia dos meus dados', margem, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        `Gerado em ${new Date().toLocaleString('pt-BR')}`,
        margem,
        y
      );
      y += 10;
      titulo('Dados pessoais');
      linha('Nome', dados.perfil.nome);
      linha('CPF', dados.perfil.cpf);
      linha('CNS', dados.perfil.cns);
      linha('E-mail', dados.perfil.email);
      linha('Telefone', dados.perfil.telefone);
      linha('Cidade', dados.perfil.cidade);
      linha('Data de nascimento', dados.perfil.dataNascimento);
      linha('Endereço', dados.perfil.endereco);
      titulo('Dados de saúde');
      linha('Tipo sanguíneo', dados.perfil.tipoSanguineo);
      linha('Alergias', dados.perfil.alergias);
      linha('Contato de emergência', dados.perfil.contatoEmergencia);
      linha('Telefone de emergência', dados.perfil.telefoneEmergencia);
      titulo(`Dependentes (${dados.dependentes.length})`);
      dados.dependentes.forEach((dep: any, indice: number) => {
        linha(
          `${indice + 1}. Dependente`,
          `${dep.nome || 'Sem nome'} | Parentesco: ${dep.parentesco || 'Não informado'} | Nascimento: ${dep.data_nascimento || 'Não informado'} | CNS: ${dep.cns || 'Não informado'}`
        );
      });
      if (!dados.dependentes.length) linha('Situação', 'Nenhum dependente cadastrado');
      titulo(`Registros de vacinação (${dados.vacinas.length})`);
      dados.vacinas.forEach((vacina: any, indice: number) => {
        linha(
          `${indice + 1}. Vacina`,
          `${vacina.nome || 'Não informada'} | Aplicação: ${vacina.data_aplicacao || 'Não informada'} | Lote: ${vacina.lote || 'Não informado'} | Fabricante: ${vacina.fabricante || 'Não informado'} | Status: ${vacina.status || 'Não informado'}`
        );
      });
      if (!dados.vacinas.length) linha('Situação', 'Nenhum registro de vacinação');
      titulo(`Certificados (${dados.certificados.length})`);
      dados.certificados.forEach((certificado: any, indice: number) => {
        linha(
          `${indice + 1}. Certificado`,
          `Código: ${certificado.codigo} | Versão: ${certificado.versao ?? 'Não informada'} | Status: ${certificado.status || 'Não informado'} | Emitido em: ${certificado.emitido_em || 'Não informado'}`
        );
      });
      if (!dados.certificados.length) linha('Situação', 'Nenhum certificado emitido');
      titulo(`Notificações (${dados.notificacoes.length})`);
      dados.notificacoes.forEach((notificacao: any, indice: number) => {
        linha(
          `${indice + 1}. Notificação`,
          notificacao.titulo || notificacao.mensagem || 'Registro de notificação'
        );
      });
      if (!dados.notificacoes.length) linha('Situação', 'Nenhuma notificação registrada');
      novaPaginaSePreciso(18);
      y += 5;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      const aviso = doc.splitTextToSize(dados.observacao, largura);
      doc.text(aviso, margem, y);
      doc.save(`meus_dados_easyvacc_${new Date().toISOString().slice(0, 10)}.pdf`);
      setSucesso('Seu PDF foi gerado com sucesso.');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar o PDF com seus dados.'
      );
    } finally {
      setExportandoDados(false);
    }
  };
  // =====================================================
  // AUTORIZAÇÃO TEMPORÁRIA DE ATENDIMENTO
  // =====================================================
  const gerarAutorizacaoAtendimento = async () => {
    if (gerandoAutorizacao) return;
    setGerandoAutorizacao(true);
    setErro('');
    setSucesso('');
    try {
      const { data, error } = await supabase.rpc('gerar_autorizacao_atendimento');
      if (error) throw error;
      const autorizacao = Array.isArray(data) ? data[0] : data;
      if (!autorizacao?.codigo || !autorizacao?.expira_em) {
        throw new Error('A autorização não foi retornada corretamente.');
      }
      setCodigoAutorizacao(String(autorizacao.codigo));
      setExpiraAutorizacao(String(autorizacao.expira_em));
      setSucesso('Código de atendimento gerado com sucesso.');
    } catch (error) {
      console.error('Erro ao gerar autorização de atendimento:', error);
      setErro('Não foi possível gerar o código de atendimento. Tente novamente.');
    } finally {
      setGerandoAutorizacao(false);
    }
  };

  // =====================================================
  // SOLICITAÇÃO DE EXCLUSÃO DA CONTA
  // =====================================================
  const abrirModalExclusao = () => {
    setErro('');
    setSucesso('');
    setModalExclusao(true);
  };

  const fecharModalExclusao = () => {
    if (solicitandoExclusao) return;
    setModalExclusao(false);
  };

  const confirmarSolicitacaoExclusao = async () => {
    if (solicitandoExclusao || statusExclusao) return;
    setSolicitandoExclusao(true);
    setErro('');
    setSucesso('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Sua sessão expirou. Entre novamente para continuar.');
      }

      const { error } = await supabase
        .from('solicitacoes_exclusao')
        .insert({ usuario_id: user.id, status: 'pendente' });

      if (error) {
        if (error.code === '23505') {
          setStatusExclusao('pendente');
          setModalExclusao(false);
          setSucesso('Sua solicitação de exclusão já está registrada e aguardando análise.');
          return;
        }
        throw error;
      }

      setStatusExclusao('pendente');
      setModalExclusao(false);
      setSucesso('Solicitação de exclusão enviada com sucesso. Ela ficará registrada para análise.');
    } catch (error) {
      console.error('Erro ao solicitar exclusão da conta:', error);
      setErro(error instanceof Error ? error.message : 'Não foi possível enviar a solicitação de exclusão. Tente novamente.');
    } finally {
      setSolicitandoExclusao(false);
    }
  };

  // =====================================================
  // CARREGANDO
  // =====================================================
  if (carregando) {
  return (
    <div className="ev-page mx-auto min-h-screen max-w-5xl bg-transparent p-4 pb-20 text-slate-100 sm:p-8">
      <div
        role="status"
        aria-live="polite"
        aria-label="Carregando perfil"
      >
        <span className="sr-only">
          Carregando seu perfil...
        </span>

        {/* Cabeçalho */}
        <div className="mb-8 border-b border-slate-800 pb-4">
          <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-800" />
          <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-slate-800/70" />
          <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-800/50" />
        </div>

        {/* Card principal */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#081629]/90">
          <div className="h-32 animate-pulse border-b border-slate-800 bg-slate-800/60" />

          <div className="relative px-5 pb-8 sm:px-8">
            {/* Avatar */}
            <div className="absolute -top-12 left-5 h-24 w-24 animate-pulse rounded-full border-4 border-slate-900 bg-slate-800 sm:left-8" />

            {/* Nome */}
            <div className="pt-16">
              <div className="h-7 w-52 animate-pulse rounded bg-slate-800" />
              <div className="mt-3 h-4 w-32 animate-pulse rounded bg-slate-800/60" />
            </div>

            {/* Informações */}
            <div className="mt-10 grid grid-cols-1 gap-10 border-t border-slate-800 pt-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((grupo) => (
                <div
                  key={grupo}
                  className="space-y-6"
                >
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />

                  {[1, 2, 3].map((item) => (
                    <div key={item}>
                      <div className="h-3 w-24 animate-pulse rounded bg-slate-800/60" />
                      <div className="mt-2 h-5 w-full max-w-[180px] animate-pulse rounded bg-slate-800" />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Ações */}
            <div className="mt-10 flex gap-3 border-t border-slate-800 pt-6">
              <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-800" />
              <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  // =====================================================
  // TELA
  // =====================================================
  const temaClaroExclusao = typeof document !== 'undefined' &&
    document.querySelector('.easyvacc-app')?.classList.contains('easyvacc-light');

  return (
    <div
      className="
        ev-page mx-auto min-h-screen
        max-w-5xl
        bg-transparent
        p-4 pb-20
        font-sans
        text-slate-100
        antialiased
        sm:p-8
      "
    >
      <style>{`
        /* Botões de tamanho de fonte integrados aos temas, sem menu branco nativo. */
        .ev-page .ev-a11y-font-choice { background:rgba(22,119,189,.12); border:1px solid rgba(59,130,246,.42); color:#dbeafe; min-height:40px; }
        .ev-page .ev-a11y-font-choice[aria-pressed="true"] { background:#1677bd; border-color:#1677bd; color:#fff; }
        .easyvacc-light .ev-page .ev-a11y-font-choice { background:rgba(22,119,189,.07); border-color:#b8d2eb; color:#173c63; }
        .easyvacc-light .ev-page .ev-a11y-font-choice[aria-pressed="true"] { background:#1677bd; border-color:#1677bd; color:#fff; }
        .ev-profile-accordion { border: 1px solid rgba(100,116,139,.26); border-radius: 18px; background: rgba(15,35,65,.32); overflow: hidden; }
        .ev-profile-accordion-title { display:flex; align-items:center; gap:14px; padding:19px 22px; cursor:pointer; list-style:none; color:inherit; }
        .ev-profile-accordion-title::-webkit-details-marker { display:none; }
        .ev-profile-accordion-title > svg { color:#3b82f6; flex-shrink:0; }
        .ev-profile-accordion-title > span { display:flex; flex:1; flex-direction:column; gap:4px; min-width:0; }
        .ev-profile-accordion-title strong { font-size:15px; font-weight:750; }
        .ev-profile-accordion-title small { font-size:12px; opacity:.73; line-height:1.5; }
        .ev-profile-accordion-title::after { content:'⌄'; font-size:23px; opacity:.7; transition:transform .2s; }
        .ev-profile-accordion[open] > .ev-profile-accordion-title::after { transform:rotate(180deg); }
        .ev-profile-accordion-body { padding:4px 22px 22px; border-top:1px solid rgba(100,116,139,.16); }
        .ev-profile-accordion-body > .mt-10 { margin-top:16px; }
        .ev-profile-accordion-body > div#exportacao-perfil, .ev-profile-accordion-body > div.mt-10 { margin-top:8px; }
        .ev-profile-accordion-title:focus-visible { outline:3px solid #60a5fa; outline-offset:-3px; }
        .easyvacc-light .ev-profile-accordion { background:rgba(255,255,255,.84); border-color:#d3dfec; }
        .easyvacc-light .ev-profile-accordion-title { color:#152b49; }
        .easyvacc-light .ev-profile-accordion-title small { color:#526780; opacity:1; }
        .easyvacc-light .ev-profile-accordion-body { color:#243c59; }
        @media(max-width:640px) { .ev-profile-accordion-title {padding:16px;} .ev-profile-accordion-body {padding:4px 16px 18px;} }
      `}</style>
      {/* CABEÇALHO */}
      <div
        className="
          ev-page-header mb-8 flex flex-col
          items-start justify-between
          gap-4
          border-b border-slate-800
          pb-4
          sm:flex-row sm:items-end
        "
      >
        <div>
          <h1
            className="ev-page-title 
              text-3xl
              font-extrabold
              tracking-tight
              text-white
            "
          >
            Meu perfil
          </h1>
          <p
            className="
              mt-2 text-xs
              font-medium
              leading-relaxed
              text-slate-400
            "
          >
            Visualize e atualize suas informações
            de contato e dados de saúde com
            segurança e privacidade.
          </p>
          <span
            className="
              mt-1 block
              text-[11px]
              text-slate-500
            "
          >
            Última atualização cadastral:{' '}
            {usuario.updatedAt ||
              'Não informada'}
          </span>
        </div>
        <button
          type="button"
          onClick={solicitarExibicaoDadosSensiveis}
          aria-pressed={mostrarSensiveis}
          className="
            flex items-center gap-2
            rounded-xl
            border border-slate-700/80
            bg-[#081629]
            px-3.5 py-2
            text-xs text-slate-300
            shadow-sm
            transition-all
            hover:bg-slate-800
            focus:outline-none
            focus:ring-2
            focus:ring-blue-600
          "
        >
          {mostrarSensiveis ? (
            <EyeOff
              size={15}
              aria-hidden="true"
              className="text-[#126ca8]"
            />
          ) : (
            <Eye
              size={15}
              aria-hidden="true"
              className="text-[#126ca8]"
            />
          )}
          <span>
            {mostrarSensiveis
              ? 'Ocultar Dados Sensíveis'
              : 'Exibir Dados Completos'}
          </span>
        </button>
      </div>
      {/* ERRO */}
      {erro && (
        <div
          role="alert"
          className="
            mb-6 rounded-xl
            border border-red-500/30
            bg-red-500/10
            p-4
            text-sm font-semibold
            text-red-300
          "
        >
          {erro}
        </div>
      )}
      {/* SUCESSO */}
      {sucesso && (
        <div
          role="status"
          aria-live="polite"
          className="
            mb-6 flex items-center gap-2
            rounded-xl
            border border-blue-600/30
            bg-blue-600/10
            p-4
            text-sm font-semibold
            text-blue-300
          "
        >
          <CheckCircle
            size={18}
            aria-hidden="true"
          />
          {sucesso}
        </div>
      )}
      {/* CARD */}
      <div
        className="
          ev-card relative overflow-hidden
          rounded-3xl
          border border-slate-800
          bg-[#081629]/90
          shadow-2xl
          backdrop-blur-xl
        "
      >
        <style>{`
          .easyvacc-app .ev-profile-banner {
            background: linear-gradient(115deg, #194e7a 0%, #226fa8 55%, #3386ba 100%) !important;
            border-color: rgba(142, 204, 246, .20) !important;
          }
          .easyvacc-app .ev-profile-banner-title { color: #fff !important; }
          .easyvacc-app .ev-profile-banner-subtitle { color: #e0f2fe !important; }
          .easyvacc-app .ev-profile-banner-waves { color: #b7def8; }
          .easyvacc-app.easyvacc-light .ev-profile-banner {
            background: linear-gradient(115deg, #c9e2f5 0%, #b3d5ef 55%, #9bc7e8 100%) !important;
            border-color: #9bc5e5 !important;
          }
          .easyvacc-app.easyvacc-light .ev-profile-banner-title { color: #16466f !important; }
          .easyvacc-app.easyvacc-light .ev-profile-banner-subtitle { color: #365c7d !important; }
          .easyvacc-app.easyvacc-light .ev-profile-banner-waves { color: #4687b7; }
        `}</style>
        {/* BANNER */}
        <div
          className="
            relative h-20
            overflow-hidden
            border-b
            border-slate-800/80
            ev-profile-banner
          "
        >
          <div
            className="
              absolute
              -bottom-10 -right-10
              h-40 w-40
              rounded-full
              bg-[#67b7eb]/15
              blur-3xl
            "
          />
          <div className="pointer-events-none absolute inset-0 flex items-start justify-end px-5 pt-4 sm:px-8">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] ev-profile-banner-title">Minha conta</p>
              <p className="mt-1 text-xs ev-profile-banner-subtitle">Seu espaço no EasyVacc</p>
            </div>
          </div>
          <svg aria-hidden="true" className="ev-profile-banner-waves pointer-events-none absolute bottom-0 right-0 h-14 w-2/3 opacity-35" viewBox="0 0 600 70" preserveAspectRatio="none">
            <path d="M0 65 Q160 -4 310 44 T600 12" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M0 70 Q180 24 350 61 T600 35" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="relative px-5 pb-8 sm:px-8">
          {/* AVATAR */}
          <div className="group absolute -top-9 left-5 sm:left-8">
            <label
              htmlFor="input-foto"
              className="
                relative block
                cursor-pointer
                rounded-full
                focus-within:ring-2
                focus-within:ring-blue-600
              "
            >
              <div
                className="
                  relative flex
                  h-20 w-20
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  border-4
                  border-slate-900
                  bg-[#020817]
                  shadow-2xl
                "
              >
                {enviandoFoto ? (
                  <div
                    role="status"
                    aria-label="Enviando foto"
                    className="flex h-full w-full items-center justify-center bg-[#020817]"
                  >
                    <Loader2
                      size={26}
                      aria-hidden="true"
                      className="animate-spin text-[#126ca8]"
                    />
                  </div>
                ) : fotoPerfil ? (
                  <img
                    src={fotoPerfil}
                    alt={`Foto de perfil de ${usuario.nome}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-[#126ca8]">
                    {usuario.nome
                      ? usuario.nome.charAt(0).toUpperCase()
                      : '?'}
                  </span>
                )}
                <div
                  className="
                    absolute inset-0
                    flex flex-col
                    items-center
                    justify-center
                    bg-[#020817]/70
                    text-white
                    opacity-0
                    transition-opacity
                    group-hover:opacity-100
                  "
                >
                  <Camera
                    size={20}
                    aria-hidden="true"
                  />
                  <span
                    className="
                      mt-0.5
                      text-[10px]
                      font-bold
                    "
                  >
                    Editar
                  </span>
                </div>
              </div>
            </label>
            <input
              type="file"
              id="input-foto"
              accept="image/jpeg,image/png,image/webp"
              disabled={enviandoFoto}
              className="sr-only"
              aria-label="Selecionar foto de perfil"
              onChange={handleMudarFoto}
            />
          </div>
          {/* NOME */}
          <div
            className="
              mb-7 flex
              flex-col
              items-start
              justify-between
              gap-4
              pt-12
              sm:flex-row
            "
          >
            <div>
              <h2
                className="
                  text-2xl
                  font-extrabold
                  tracking-tight
                  text-white
                "
              >
                {usuario.nome ||
                  'Usuário'}
              </h2>
              <p
                className="
                  mt-1 flex
                  items-center
                  gap-2
                  text-xs
                  font-medium
                  text-slate-400
                "
              >
                <MapPin
                  size={15}
                  aria-hidden="true"
                  className="text-[#126ca8]"
                />
                {usuario.cidade ||
                  'Cidade não informada'}
              </p>
            </div>
            {!editando && (
              <button
                type="button"
                onClick={iniciarEdicao}
                className="
                  flex items-center
                  gap-2
                  rounded-xl
                  border border-blue-600/30
                  bg-blue-600/10
                  px-4 py-2.5
                  text-xs
                  font-bold
                  text-blue-300
                  transition
                  hover:bg-blue-600/20
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-600
                "
              >
                <Pencil
                  size={14}
                  aria-hidden="true"
                />
                Editar informações
              </button>
            )}
          </div>
          {/* AÇÕES DE EDIÇÃO SEMPRE PRÓXIMAS DO FORMULÁRIO */}
          {editando && (
            <div role="region" aria-label="Ações para editar perfil" className="mb-6 lg:sticky lg:top-3 lg:z-30 flex flex-col gap-3 rounded-2xl border border-blue-400/40 bg-[#081629] p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-white">Editando informações</p>
                <p className="text-xs text-slate-300">Altere os campos abaixo e salve quando terminar.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={cancelarEdicao} disabled={salvando} className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={salvarAlteracoes} disabled={salvando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          )}
          {/* INFORMAÇÕES */}
          <div id="dados-perfil"
            className="
              grid grid-cols-1
              gap-10
              border-t
              border-slate-800
              pt-8
              md:grid-cols-2
              lg:grid-cols-2
            "
          >
            {/* DADOS PESSOAIS */}
            <section className="ev-profile-group space-y-6">
              <h3
                className="
                  flex items-center
                  gap-2
                  text-xs
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                <User
                  size={16}
                  aria-hidden="true"
                  className="text-[#126ca8]"
                />
                Dados pessoais
              </h3>
              <div>
                <p className="text-xs font-medium text-slate-400">
                  CPF
                </p>
                <p
                  className="
                    mt-1 flex
                    items-center gap-2
                    font-mono
                    text-sm
                    font-semibold
                    tracking-wider
                    text-slate-200
                  "
                >
                  <CreditCard
                    size={16}
                    aria-hidden="true"
                    className="text-[#126ca8]"
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
                <p
                  className="
                    mt-1 flex
                    items-center gap-2
                    font-mono
                    text-sm
                    font-semibold
                    tracking-wider
                    text-slate-200
                  "
                >
                  <Activity
                    size={16}
                    aria-hidden="true"
                    className="text-[#126ca8]"
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
                <p
                  className="
                    mt-1 flex
                    items-center gap-2
                    text-sm
                    font-semibold
                    text-slate-200
                  "
                >
                  <Calendar
                    size={16}
                    aria-hidden="true"
                    className="text-[#126ca8]"
                  />
                  {usuario.dataNascimento ||
                    'Não informada'}
                </p>
              </div>
            </section>
            {/* CONTATO */}
            <section className="ev-profile-group space-y-6">
              <h3
                className="
                  flex items-center
                  gap-2
                  text-xs
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                <MapPin
                  size={16}
                  aria-hidden="true"
                  className="text-[#126ca8]"
                />
                Contato e endereço
              </h3>
              {/* EMAIL */}
              <div>
                <p className="text-xs font-medium text-slate-400">
                  E-mail
                </p>
                <p
                  className="
                    mt-1 flex
                    items-center gap-2
                    break-all
                    text-sm
                    font-semibold
                    text-slate-200
                  "
                >
                  <Mail
                    size={16}
                    aria-hidden="true"
                    className="
                      shrink-0
                      text-[#126ca8]
                    "
                  />
                  {usuario.email ||
                    'Não informado'}
                </p>
              </div>
              {/* TELEFONE */}
              <div>
                <label
                  htmlFor="telefone"
                  className="
                    text-xs
                    font-medium
                    text-slate-400
                  "
                >
                  Telefone / WhatsApp
                </label>
                {editando ? (
                  <input
                    id="telefone"
                    type="tel"
                    autoComplete="tel"
                    value={
                      formulario.telefone
                    }
                    onChange={(e) =>
                      alterarCampo(
                        'telefone',
                        e.target.value
                      )
                    }
                    placeholder="(00) 00000-0000"
                    className="
                      mt-2 w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-[#020817]
                      px-3 py-2.5
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-blue-600
                      focus:ring-2
                      focus:ring-blue-600/20
                    "
                  />
                ) : (
                  <p
                    className="
                      mt-1 flex
                      items-center gap-2
                      text-sm
                      font-semibold
                      text-slate-200
                    "
                  >
                    <Phone
                      size={16}
                      aria-hidden="true"
                      className="text-[#126ca8]"
                    />
                    {usuario.telefone ||
                      'Não informado'}
                  </p>
                )}
              </div>
              {/* ENDEREÇO */}
              <div>
                <label
                  htmlFor="endereco"
                  className="
                    text-xs
                    font-medium
                    text-slate-400
                  "
                >
                  Endereço Residencial
                </label>
                {editando ? (
                  <input
                    id="endereco"
                    type="text"
                    autoComplete="street-address"
                    value={
                      formulario.endereco
                    }
                    onChange={(e) =>
                      alterarCampo(
                        'endereco',
                        e.target.value
                      )
                    }
                    placeholder="Informe seu endereço"
                    className="
                      mt-2 w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-[#020817]
                      px-3 py-2.5
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-blue-600
                      focus:ring-2
                      focus:ring-blue-600/20
                    "
                  />
                ) : (
                  <p
                    className="
                      mt-1 flex
                      items-start gap-2
                      text-sm
                      font-semibold
                      text-slate-200
                    "
                  >
                    <Home
                      size={16}
                      aria-hidden="true"
                      className="
                        mt-0.5
                        shrink-0
                        text-[#126ca8]
                      "
                    />
                    <span className="leading-snug">
                      {usuario.endereco ||
                        'Endereço não cadastrado'}
                    </span>
                  </p>
                )}
              </div>
            </section>
            {/* DADOS DE SAÚDE */}
            <section className="ev-profile-group space-y-6 md:col-span-2">
              <h3
                className="
                  flex items-center
                  gap-2
                  text-xs
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                <Heart
                  size={16}
                  aria-hidden="true"
                  className="text-[#126ca8]"
                />
                Informações de saúde
              </h3>
              {/* TIPO SANGUÍNEO */}
              <div>
                <label
                  htmlFor="tipo-sanguineo"
                  className="
                    text-xs
                    font-medium
                    text-slate-400
                  "
                >
                  Tipo Sanguíneo
                </label>
                {editando ? (
                  <select
                    id="tipo-sanguineo"
                    value={
                      formulario.tipoSanguineo
                    }
                    onChange={(e) =>
                      alterarCampo(
                        'tipoSanguineo',
                        e.target.value
                      )
                    }
                    className="
                      mt-2 w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-[#020817]
                      px-3 py-2.5
                      text-sm
                      text-white
                      outline-none
                      transition
                      focus:border-blue-600
                      focus:ring-2
                      focus:ring-blue-600/20
                    "
                  >
                    <option value="">
                      Selecione
                    </option>
                    <option value="A+">
                      A+
                    </option>
                    <option value="A-">
                      A-
                    </option>
                    <option value="B+">
                      B+
                    </option>
                    <option value="B-">
                      B-
                    </option>
                    <option value="AB+">
                      AB+
                    </option>
                    <option value="AB-">
                      AB-
                    </option>
                    <option value="O+">
                      O+
                    </option>
                    <option value="O-">
                      O-
                    </option>
                  </select>
                ) : (
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
                )}
              </div>
              {/* ALERGIAS */}
              <div>
                <label
                  htmlFor="alergias"
                  className="
                    text-xs
                    font-medium
                    text-slate-400
                  "
                >
                  Alergias Conhecidas
                </label>
                {editando ? (
                  <textarea
                    id="alergias"
                    rows={3}
                    value={
                      formulario.alergias
                    }
                    onChange={(e) =>
                      alterarCampo(
                        'alergias',
                        e.target.value
                      )
                    }
                    placeholder="Informe alergias conhecidas"
                    className="
                      mt-2 w-full
                      resize-none
                      rounded-xl
                      border
                      border-slate-700
                      bg-[#020817]
                      px-3 py-2.5
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-blue-600
                      focus:ring-2
                      focus:ring-blue-600/20
                    "
                  />
                ) : (
                  <p
                    className="
                      mt-1
                      whitespace-pre-wrap
                      text-sm
                      font-semibold
                      text-slate-200
                    "
                  >
                    {usuario.alergias ||
                      'Não informadas'}
                  </p>
                )}
              </div>
              {/* CONTATO DE EMERGÊNCIA */}
              <div
                className="
                  mt-2
                  rounded-2xl
                  border
                  border-rose-500/20
                  bg-rose-500/10
                  p-4
                "
              >
                <p
                  className="
                    mb-3
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-rose-400
                  "
                >
                  Contato de Emergência
                </p>
                {editando ? (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="contato-emergencia"
                        className="
                          mb-1 block
                          text-[11px]
                          font-medium
                          text-slate-400
                        "
                      >
                        Nome do contato
                      </label>
                      <input
                        id="contato-emergencia"
                        type="text"
                        value={
                          formulario.contatoEmergencia
                        }
                        onChange={(e) =>
                          alterarCampo(
                            'contatoEmergencia',
                            e.target.value
                          )
                        }
                        placeholder="Nome do contato"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-700
                          bg-[#020817]
                          px-3 py-2.5
                          text-sm
                          text-white
                          outline-none
                          transition
                          placeholder:text-slate-600
                          focus:border-rose-400
                          focus:ring-2
                          focus:ring-rose-400/20
                        "
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="telefone-emergencia"
                        className="
                          mb-1 block
                          text-[11px]
                          font-medium
                          text-slate-400
                        "
                      >
                        Telefone
                      </label>
                      <input
                        id="telefone-emergencia"
                        type="tel"
                        autoComplete="tel"
                        value={
                          formulario.telefoneEmergencia
                        }
                        onChange={(e) =>
                          alterarCampo(
                            'telefoneEmergencia',
                            e.target.value
                          )
                        }
                        placeholder="(00) 00000-0000"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-700
                          bg-[#020817]
                          px-3 py-2.5
                          text-sm
                          text-white
                          outline-none
                          transition
                          placeholder:text-slate-600
                          focus:border-rose-400
                          focus:ring-2
                          focus:ring-rose-400/20
                        "
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p
                      className="
                        text-sm
                        font-bold
                        text-slate-200
                      "
                    >
                      {usuario.contatoEmergencia ||
                        'Não cadastrado'}
                    </p>
                    <p
                      className="
                        mt-0.5
                        text-xs
                        text-slate-400
                      "
                    >
                      {usuario.telefoneEmergencia ||
                        'Adicione um contato'}
                    </p>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* EASYVACC ACESSÍVEL — ajustes voluntários da interface */}
          <details id="acessibilidade-perfil" className="ev-profile-accordion mt-5" open={acessibilidade.ativo}>
            <summary className="ev-profile-accordion-title"><Accessibility size={21} aria-hidden="true" /><span><strong>EasyVacc Acessível</strong><small>Leitura, contraste e tamanho das letras</small></span></summary>
            <div className="ev-profile-accordion-body">
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-700 p-4">
              <span id="ev-ativar-acessivel" className="ev-a11y-label text-sm font-bold text-white">Ativar modo acessível</span>
              <button type="button" role="switch" aria-labelledby="ev-ativar-acessivel" aria-checked={acessibilidade.ativo} onClick={() => setAcessibilidade((a) => ({ ...a, ativo: !a.ativo }))} className="ev-a11y-toggle"><span aria-hidden="true" className="ev-a11y-toggle-thumb" /></button>
            </div>
            {acessibilidade.ativo && (
              <div className="mt-4 space-y-4">
                <div>
                  <p id="ev-tamanho-fonte-label" className="mb-2 text-sm font-semibold text-slate-200">Tamanho dos textos</p>
                  <div role="group" aria-labelledby="ev-tamanho-fonte-label" className="flex flex-wrap gap-2">
                    {([['normal', 'Normal'], ['grande', 'Grande'], ['extra', 'Muito grande']] as const).map(([valor, rotulo]) => (
                      <button
                        key={valor}
                        type="button"
                        aria-pressed={acessibilidade.fonte === valor}
                        onClick={() => setAcessibilidade((a) => ({ ...a, fonte: valor }))}
                        className="ev-a11y-font-choice rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        {rotulo}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 p-4">
                  <div className="min-w-0"><span id="ev-contraste-label" className="ev-a11y-label block text-sm font-semibold text-white">Aumentar contraste dos textos</span><p className="ev-a11y-help mt-1 text-xs text-slate-300">Melhora a leitura das informações.</p></div>
                  <button type="button" role="switch" aria-labelledby="ev-contraste-label" aria-checked={acessibilidade.contraste} onClick={() => setAcessibilidade((a) => ({ ...a, contraste: !a.contraste }))} className="ev-a11y-toggle"><span aria-hidden="true" className="ev-a11y-toggle-thumb" /></button>
                </div>
              </div>
            )}
            <button type="button" onClick={lerOrientacoes} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-400/50 bg-blue-600/20 px-4 py-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400">
              {lendoAcessibilidade ? <Square size={16} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
              {lendoAcessibilidade ? 'Parar leitura' : 'Ouvir orientações do EasyVacc'}
            </button>
            <p className="ev-a11y-help mt-2 text-xs leading-5 text-slate-400">A leitura usa a voz disponível no navegador. Não lê automaticamente dados pessoais ou de saúde.</p>
            </div>
          </details>

          {/* SEGURANÇA E AUTORIZAÇÕES */}
          <details id="seguranca-perfil" className="ev-profile-accordion mt-3">
            <summary className="ev-profile-accordion-title"><Fingerprint size={21} aria-hidden="true" /><span><strong>Segurança e autorizações</strong><small>Biometria, dispositivos e atendimento</small></span></summary>
            <div className="ev-profile-accordion-body" aria-label="Segurança e autorizações">
          {/* AUTORIZAÇÃO DE ATENDIMENTO */}
          <section className="mt-10 rounded-2xl border border-blue-600/20 bg-blue-600/5 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Autorizar atendimento</h3>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
                  Gere um código temporário para autorizar um profissional do EasyVacc a localizar sua carteira e seus dependentes durante o atendimento. O código vale por 10 minutos e pode ser usado uma única vez.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void gerarAutorizacaoAtendimento()}
                disabled={gerandoAutorizacao}
                className="ev-btn-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {gerandoAutorizacao ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <CheckCircle size={15} aria-hidden="true" />}
                {gerandoAutorizacao ? 'Gerando...' : codigoAutorizacao ? 'Gerar novo código' : 'Gerar código'}
              </button>
            </div>
            {codigoAutorizacao && (
              <div className="mt-5 rounded-xl border border-blue-600/30 bg-[#020817] p-4" role="status" aria-live="polite">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Código de atendimento</p>
                <p className="mt-1 font-mono text-3xl font-black tracking-[0.25em] text-blue-500">{codigoAutorizacao}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Válido até {new Date(expiraAutorizacao).toLocaleString('pt-BR')}. Informe ao profissional seu CPF e este código somente durante o atendimento.
                </p>
              </div>
            )}
          </section>

          {/* Ajustes exclusivos do tema claro para o painel de biometria. */}
          <style>{`
            .easyvacc-app.easyvacc-light .ev-alerta-email-section {
              background: rgba(255, 255, 255, 0.94) !important;
              border-color: #cbd5e1 !important;
              box-shadow: 0 8px 26px rgba(15, 43, 73, 0.07);
            }
            .easyvacc-app.easyvacc-light .ev-alerta-email-title {
              color: #102b49 !important;
            }
            .easyvacc-app.easyvacc-light .ev-alerta-email-description,
            .easyvacc-app.easyvacc-light .ev-alerta-email-address {
              color: #475569 !important;
            }
            .easyvacc-app.easyvacc-light .ev-alerta-email-toggle {
              color: #1e293b !important;
            }
            .easyvacc-app.easyvacc-light .ev-alerta-email-success {
              color: #075985 !important;
            }
            .easyvacc-app.easyvacc-light .ev-alerta-email-error {
              color: #9f1239 !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-section {
              background: rgba(255, 255, 255, 0.94) !important;
              border-color: #cbd5e1 !important;
              box-shadow: 0 8px 26px rgba(15, 43, 73, 0.07);
            }
            .easyvacc-app.easyvacc-light .ev-passkey-title {
              color: #102b49 !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-description,
            .easyvacc-app.easyvacc-light .ev-passkey-date,
            .easyvacc-app.easyvacc-light .ev-passkey-empty {
              color: #475569 !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-list-title,
            .easyvacc-app.easyvacc-light .ev-passkey-name {
              color: #1e293b !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-divider {
              border-color: #e2e8f0 !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-item {
              background: #f8fafc !important;
              border-color: #dbe3ed !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-register {
              background: #126ca8 !important;
              color: #ffffff !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-register:hover {
              background: #105b90 !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-remove {
              color: #be123c !important;
              border-color: #fda4af !important;
              background: #fff1f2 !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-remove:hover {
              background: #ffe4e6 !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-error {
              color: #9f1239 !important;
              background: #fff1f2 !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-success {
              color: #075985 !important;
              background: #e0f2fe !important;
            }
            .easyvacc-app.easyvacc-light .ev-passkey-warning {
              color: #92400e !important;
            }
          `}</style>
          {/* EASYVACC ALERTA — PREFERÊNCIA DE E-MAIL */}
          <section className="ev-alerta-email-section mt-8 rounded-2xl border border-blue-500/25 bg-[#081629]/85 p-5" aria-labelledby="titulo-alerta-email">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 id="titulo-alerta-email" className="ev-alerta-email-title flex items-center gap-2 text-sm font-bold text-white">
                  <BellRing size={19} className="text-[#4da7e2]" aria-hidden="true" />
                  EasyVacc Alerta — lembretes por e-mail
                </h3>
                <p className="ev-alerta-email-description mt-2 max-w-2xl text-xs leading-5 text-slate-400">
                  Deseja receber e-mails quando uma próxima dose de vacinação estiver chegando ou atrasada?
                  Os lembretes também podem incluir vacinas dos seus dependentes.
                  Você pode mudar sua escolha a qualquer momento.
                </p>
                <p className="ev-alerta-email-address mt-1 break-all text-[11px] text-slate-400">
                  E-mail cadastrado: {usuario.email || 'Não informado'}
                </p>
              </div>
              <label className="ev-alerta-email-toggle inline-flex shrink-0 items-center gap-3 text-xs font-semibold text-slate-200">
                <span>{carregandoPreferencia ? 'Carregando...' : emailAlertaAtivo ? 'Ativado' : 'Desativado'}</span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Receber lembretes de vacinação por e-mail"
                  checked={emailAlertaAtivo}
                  disabled={carregandoPreferencia || salvandoPreferencia || !usuario.id || !preferenciaDisponivel}
                  onChange={(e) => void alterarPreferenciaEmail(e.target.checked)}
                  className="ev-alerta-email-input peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border shadow-inner transition-colors duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4da7e2] peer-disabled:opacity-50 ${emailAlertaAtivo ? 'border-[#126ca8] bg-[#126ca8]' : 'border-slate-500/50 bg-slate-500'}`}
                >
                  <span className={`absolute left-[3px] top-[3px] h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${emailAlertaAtivo ? 'translate-x-6' : 'translate-x-0'}`} />
                </span>
                {salvandoPreferencia && <Loader2 size={15} className="animate-spin text-[#4da7e2]" aria-hidden="true" />}
              </label>
            </div>
            {erroPreferencia && <p role="alert" className="ev-alerta-email-error mt-3 text-xs text-rose-300">{erroPreferencia}</p>}
            {sucessoPreferencia && <p role="status" className="ev-alerta-email-success mt-3 text-xs text-blue-300">{sucessoPreferencia}</p>}
          </section>
          {/* SEGURANÇA: FACE ID / BIOMETRIA */}
          <section className="ev-passkey-section mt-8 rounded-2xl border border-blue-500/25 bg-[#081629]/85 p-5" aria-labelledby="titulo-passkeys">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 id="titulo-passkeys" className="ev-passkey-title flex items-center gap-2 text-sm font-bold text-white">
                  <Fingerprint size={19} className="text-[#4da7e2]" aria-hidden="true" />
                  Segurança — Face ID e biometria
                </h3>
                <p className="ev-passkey-description mt-2 max-w-2xl text-xs leading-5 text-slate-400">
                  Cadastre uma Passkey para entrar com Face ID, impressão digital ou bloqueio do dispositivo.
                  A verificação é feita pelo aparelho, sem enviar seu rosto ao EasyVacc.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void cadastrarPasskey()}
                disabled={!passkeysDisponiveis() || salvandoPasskey || carregandoPasskeys || Boolean(removendoPasskey)}
                className="ev-btn-primary ev-passkey-register inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#126ca8] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#105b90] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvandoPasskey ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
                {salvandoPasskey ? 'Cadastrando...' : 'Cadastrar biometria'}
              </button>
            </div>
            {!passkeysDisponiveis() && (
              <p className="ev-passkey-warning mt-3 text-xs text-amber-300">A biometria exige HTTPS (ou localhost) e um navegador compatível com Passkeys.</p>
            )}
            {erroPasskey && <p role="alert" className="ev-passkey-error mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{erroPasskey}</p>}
            {sucessoPasskey && <p role="status" className="ev-passkey-success mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">{sucessoPasskey}</p>}
            {passkeysDisponiveis() && (
              <div className="ev-passkey-divider mt-4 border-t border-slate-700/70 pt-4">
                <p className="ev-passkey-list-title mb-2 text-xs font-semibold text-slate-300">Dispositivos autorizados</p>
                {carregandoPasskeys ? (
                  <p className="ev-passkey-empty flex items-center gap-2 text-xs text-slate-400"><Loader2 size={14} className="animate-spin" /> Consultando dispositivos...</p>
                ) : passkeys.length === 0 ? (
                  <p className="ev-passkey-empty text-xs text-slate-400">Nenhuma biometria cadastrada nesta conta.</p>
                ) : (
                  <ul className="space-y-2">
                    {passkeys.map((passkey) => (
                      <li key={passkey.id} className="ev-passkey-item flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-[#020817]/40 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="ev-passkey-name break-words text-xs font-semibold text-slate-100">{passkey.friendly_name || 'Passkey cadastrada'}</p>
                          <p className="ev-passkey-date mt-1 text-[11px] text-slate-400">Cadastrada em {new Date(passkey.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void removerPasskey(passkey)}
                          disabled={Boolean(removendoPasskey) || salvandoPasskey}
                          aria-label={`Remover biometria ${passkey.friendly_name || 'cadastrada'}`}
                          className="ev-passkey-remove inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                        >
                          {removendoPasskey === passkey.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
            </div>
          </details>
          {/* EXPORTAÇÃO DE DADOS */}
          <details id="exportacao-perfil" className="ev-profile-accordion mt-3">
            <summary className="ev-profile-accordion-title"><Download size={21} aria-hidden="true" /><span><strong>Privacidade e meus arquivos</strong><small>Exportar informações em PDF ou JSON</small></span></summary>
            <div className="ev-profile-accordion-body">
          <div
            className="
              mt-10 flex
              flex-col
              items-center
              justify-between
              gap-4
              border-t
              border-slate-800
              pt-6
              sm:flex-row
            "
          >
            <div
              className="
                flex w-full
                flex-wrap gap-3
                sm:w-auto
              "
            >
              <button
                type="button"
                onClick={() => void baixarDadosPdf()}
                disabled={salvando || exportandoDados}
                className="ev-btn-secondary flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {exportandoDados ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <FileText size={14} className="text-[#126ca8]" aria-hidden="true" />}
                Baixar PDF
              </button>
              <button
                type="button"
                onClick={() => void baixarDadosJson()}
                disabled={salvando || exportandoDados}
                className="ev-btn-secondary flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <Download size={14} className="text-[#126ca8]" aria-hidden="true" />
                Baixar JSON
              </button>

            </div>

          </div>
            </div>
          </details>
          <section className="ev-profile-danger-zone" aria-labelledby="titulo-zona-exclusao">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 id="titulo-zona-exclusao" className="text-sm font-extrabold">Exclusão da conta</h3>
                <p className="mt-2 max-w-xl text-xs leading-5 text-slate-400">
                  Esta opção fica separada das ações comuns para evitar solicitações acidentais.
                  A exclusão exige confirmação e passa por análise.
                </p>
              </div>
              <button
                type="button"
                disabled={salvando || solicitandoExclusao || Boolean(statusExclusao)}
                onClick={abrirModalExclusao}
                className="ev-btn-danger inline-flex items-center justify-center gap-2
                  px-4 py-2.5
                  text-xs
                  font-medium
                  text-white
                  transition
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  focus:outline-none
                  focus:ring-2
                  focus:ring-rose-400
                "
              >
                {statusExclusao === 'em_analise'
                  ? 'Exclusão em análise'
                  : statusExclusao === 'pendente'
                    ? 'Exclusão solicitada'
                    : 'Solicitar exclusão'}
              </button>
            </div>
          </section>
        </div>
      </div>
      {/* Janela de exclusão isolada do scroll e das cores do restante do Perfil. */}
      {modalExclusao && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-exclusao"
          className="fixed inset-0 overflow-y-auto overscroll-contain p-4 backdrop-blur-sm"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(2, 8, 23, 0.78)',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            paddingTop: 'max(16px, env(safe-area-inset-top))',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex min-h-full w-full items-center justify-center">
            <div
              className="w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border p-5 shadow-2xl sm:p-6"
              style={{
                maxHeight: 'calc(100dvh - 32px)',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                backgroundColor: temaClaroExclusao ? '#ffffff' : '#081629',
                borderColor: temaClaroExclusao ? '#fecdd3' : 'rgba(244, 63, 94, 0.3)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2
                    id="titulo-exclusao"
                    className="text-lg font-extrabold"
                    style={{ color: temaClaroExclusao ? '#0f172a' : '#ffffff' }}
                  >
                    Solicitar exclusão da conta
                  </h2>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: temaClaroExclusao ? '#334155' : '#cbd5e1' }}
                  >
                    Sua conta não será apagada imediatamente. A solicitação será registrada para análise e tratamento seguro dos seus dados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fecharModalExclusao}
                  disabled={solicitandoExclusao}
                  aria-label="Fechar solicitação de exclusão"
                  className="shrink-0 rounded-lg p-2 transition focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50"
                  style={{ color: temaClaroExclusao ? '#475569' : '#94a3b8' }}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <div
                className="mt-5 rounded-xl border p-4"
                style={{
                  backgroundColor: temaClaroExclusao ? '#fff1f2' : 'rgba(244, 63, 94, 0.10)',
                  borderColor: temaClaroExclusao ? '#fecdd3' : 'rgba(244, 63, 94, 0.20)',
                }}
              >
                <p
                  className="text-sm font-semibold leading-6"
                  style={{
                    // Cor explícita: evita que estilos globais deixem o aviso rosa-claro no tema claro.
                    color: temaClaroExclusao ? '#881337' : '#fecdd3',
                    opacity: 1,
                  }}
                >
                  Registros que precisem ser preservados por obrigação legal, segurança ou auditoria poderão receber tratamento específico antes do encerramento definitivo.
                </p>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharModalExclusao}
                  disabled={solicitandoExclusao}
                  className="rounded-xl border px-4 py-2.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                  style={{
                    backgroundColor: temaClaroExclusao ? '#f1f5f9' : '#1e293b',
                    borderColor: temaClaroExclusao ? '#e2e8f0' : '#334155',
                    color: temaClaroExclusao ? '#334155' : '#cbd5e1',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void confirmarSolicitacaoExclusao()}
                  disabled={solicitandoExclusao}
                  className="ev-btn-danger flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {solicitandoExclusao && <Loader2 size={15} aria-hidden="true" className="animate-spin" />}
                  {solicitandoExclusao ? 'Enviando...' : 'Confirmar solicitação'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Janela de identidade fora do contêiner de rolagem do Perfil, como a exclusão. */}
      {modalReautenticacao && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-reauth"
          className="fixed inset-0 overflow-y-auto overscroll-contain p-4 backdrop-blur-sm"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(2, 8, 23, 0.78)',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            paddingTop: 'max(16px, env(safe-area-inset-top))',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex min-h-full w-full items-center justify-center">
            <div
              className="w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-slate-700 bg-[#081629] p-6 shadow-2xl"
              style={{
                maxHeight: 'calc(100dvh - 32px)',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                ...(temaClaroExclusao ? {
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                } : {}),
              }}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2
                    id="titulo-reauth"
                    className="text-lg font-extrabold text-white"
                    style={temaClaroExclusao ? { color: '#18324d' } : undefined}
                  >
                    Confirmar sua identidade
                  </h2>
                  <p
                    className="mt-2 text-sm leading-relaxed text-slate-400"
                    style={temaClaroExclusao ? { color: '#475569' } : undefined}
                  >
                    Digite sua senha para visualizar CPF e CNS completos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fecharReautenticacao}
                  disabled={validandoSenha}
                  aria-label="Fechar confirmação de identidade"
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                  style={temaClaroExclusao ? { color: '#475569' } : undefined}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <form onSubmit={confirmarReautenticacao}>
                <label
                  htmlFor="senha-reauth"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400"
                  style={temaClaroExclusao ? { color: '#475569' } : undefined}
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="senha-reauth"
                    type={mostrarSenhaReautenticacao ? 'text' : 'password'}
                    value={senhaReautenticacao}
                    onChange={(e) => setSenhaReautenticacao(e.target.value)}
                    autoComplete="current-password"
                    autoFocus
                    required
                    disabled={validandoSenha}
                    className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 pr-12 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:opacity-60 sm:text-sm"
                    style={temaClaroExclusao ? {
                      backgroundColor: '#f8fafc',
                      borderColor: '#cbd5e1',
                      color: '#1e293b',
                    } : undefined}
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaReautenticacao((valor) => !valor)}
                    disabled={validandoSenha}
                    aria-label={mostrarSenhaReautenticacao ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 disabled:opacity-50"
                    style={temaClaroExclusao ? { color: '#475569' } : undefined}
                  >
                    {mostrarSenhaReautenticacao ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={fecharReautenticacao}
                    disabled={validandoSenha}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                    style={temaClaroExclusao ? {
                      backgroundColor: '#f1f5f9',
                      borderColor: '#cbd5e1',
                      color: '#334155',
                    } : undefined}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={validandoSenha || !senhaReautenticacao}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    style={temaClaroExclusao ? { backgroundColor: '#126ca8', color: '#ffffff' } : undefined}
                  >
                    {validandoSenha && <Loader2 size={15} aria-hidden="true" className="animate-spin" />}
                    {validandoSenha ? 'Confirmando...' : 'Confirmar e exibir'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
