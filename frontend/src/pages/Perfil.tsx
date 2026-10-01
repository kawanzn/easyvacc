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
  Pencil,
  Save,
  X,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { jsPDF } from 'jspdf';
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
    <div className="mx-auto min-h-screen max-w-5xl bg-slate-950 p-4 pb-20 text-slate-100 sm:p-8">
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
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90">
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
  return (
    <div
      className="
        mx-auto min-h-screen
        max-w-5xl
        bg-slate-950
        p-4 pb-20
        font-sans
        text-slate-100
        antialiased
        sm:p-8
      "
    >
      {/* CABEÇALHO */}
      <div
        className="
          mb-8 flex flex-col
          items-start justify-between
          gap-4
          border-b border-slate-800
          pb-4
          sm:flex-row sm:items-end
        "
      >
        <div>
          <h1
            className="
              text-3xl
              font-extrabold
              tracking-tight
              text-white
            "
          >
            Meu Perfil
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
            bg-slate-900
            px-3.5 py-2
            text-xs text-slate-300
            shadow-sm
            transition-all
            hover:bg-slate-800
            focus:outline-none
            focus:ring-2
            focus:ring-emerald-500
          "
        >
          {mostrarSensiveis ? (
            <EyeOff
              size={15}
              aria-hidden="true"
              className="text-[#00a884]"
            />
          ) : (
            <Eye
              size={15}
              aria-hidden="true"
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
            border border-emerald-500/30
            bg-emerald-500/10
            p-4
            text-sm font-semibold
            text-emerald-300
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
          relative overflow-hidden
          rounded-3xl
          border border-slate-800
          bg-slate-900/90
          shadow-2xl
          backdrop-blur-xl
        "
      >
        {/* BANNER */}
        <div
          className="
            relative h-32
            overflow-hidden
            border-b
            border-slate-800/80
            bg-gradient-to-r
            from-emerald-950
            via-slate-900
            to-slate-950
          "
        >
          <div
            className="
              absolute
              -bottom-10 -right-10
              h-40 w-40
              rounded-full
              bg-[#00a884]/20
              blur-3xl
            "
          />
        </div>
        <div className="relative px-5 pb-8 sm:px-8">
          {/* AVATAR */}
          <div className="group absolute -top-12 left-5 sm:left-8">
            <label
              htmlFor="input-foto"
              className="
                relative block
                cursor-pointer
                rounded-full
                focus-within:ring-2
                focus-within:ring-emerald-500
              "
            >
              <div
                className="
                  relative flex
                  h-24 w-24
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  border-4
                  border-slate-900
                  bg-slate-950
                  shadow-2xl
                "
              >
                {enviandoFoto ? (
                  <div
                    role="status"
                    aria-label="Enviando foto"
                    className="flex h-full w-full items-center justify-center bg-slate-950"
                  >
                    <Loader2
                      size={26}
                      aria-hidden="true"
                      className="animate-spin text-[#00a884]"
                    />
                  </div>
                ) : fotoPerfil ? (
                  <img
                    src={fotoPerfil}
                    alt={`Foto de perfil de ${usuario.nome}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-[#00a884]">
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
                    bg-slate-950/70
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
              mb-10 flex
              flex-col
              items-start
              justify-between
              gap-4
              pt-16
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
                  className="text-[#00a884]"
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
                  border border-emerald-500/30
                  bg-emerald-500/10
                  px-4 py-2.5
                  text-xs
                  font-bold
                  text-emerald-300
                  transition
                  hover:bg-emerald-500/20
                  focus:outline-none
                  focus:ring-2
                  focus:ring-emerald-500
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
          {/* INFORMAÇÕES */}
          <div
            className="
              grid grid-cols-1
              gap-10
              border-t
              border-slate-800
              pt-8
              md:grid-cols-2
              lg:grid-cols-3
            "
          >
            {/* IDENTIFICAÇÃO */}
            <div className="space-y-6">
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
                  className="text-[#00a884]"
                />
                Identificação
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
                    className="text-[#00a884]"
                  />
                  {usuario.dataNascimento ||
                    'Não informada'}
                </p>
              </div>
            </div>
            {/* CONTATO */}
            <div className="space-y-6">
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
                  className="text-[#00a884]"
                />
                Contato e Endereço
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
                      text-[#00a884]
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
                      bg-slate-950
                      px-3 py-2.5
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-emerald-500
                      focus:ring-2
                      focus:ring-emerald-500/20
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
                      className="text-[#00a884]"
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
                      bg-slate-950
                      px-3 py-2.5
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-emerald-500
                      focus:ring-2
                      focus:ring-emerald-500/20
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
                        text-[#00a884]
                      "
                    />
                    <span className="leading-snug">
                      {usuario.endereco ||
                        'Endereço não cadastrado'}
                    </span>
                  </p>
                )}
              </div>
            </div>
            {/* DADOS CLÍNICOS */}
            <div className="space-y-6">
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
                  className="text-[#00a884]"
                />
                Dados Clínicos (Restrito)
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
                      bg-slate-950
                      px-3 py-2.5
                      text-sm
                      text-white
                      outline-none
                      transition
                      focus:border-emerald-500
                      focus:ring-2
                      focus:ring-emerald-500/20
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
                      bg-slate-950
                      px-3 py-2.5
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-600
                      focus:border-emerald-500
                      focus:ring-2
                      focus:ring-emerald-500/20
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
                          bg-slate-950
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
                          bg-slate-950
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
            </div>
          </div>
          {/* AUTORIZAÇÃO DE ATENDIMENTO */}
          <section className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
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
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {gerandoAutorizacao ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <CheckCircle size={15} aria-hidden="true" />}
                {gerandoAutorizacao ? 'Gerando...' : codigoAutorizacao ? 'Gerar novo código' : 'Gerar código'}
              </button>
            </div>
            {codigoAutorizacao && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-slate-950 p-4" role="status" aria-live="polite">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Código de atendimento</p>
                <p className="mt-1 font-mono text-3xl font-black tracking-[0.25em] text-emerald-400">{codigoAutorizacao}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Válido até {new Date(expiraAutorizacao).toLocaleString('pt-BR')}. Informe ao profissional seu CPF e este código somente durante o atendimento.
                </p>
              </div>
            )}
          </section>
          {/* AÇÕES */}
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
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {exportandoDados ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <FileText size={14} className="text-[#00a884]" aria-hidden="true" />}
                Baixar PDF
              </button>
              <button
                type="button"
                onClick={() => void baixarDadosJson()}
                disabled={salvando || exportandoDados}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Download size={14} className="text-[#00a884]" aria-hidden="true" />
                Baixar JSON
              </button>
              <button
                type="button"
                disabled={salvando || solicitandoExclusao || Boolean(statusExclusao)}
                onClick={abrirModalExclusao}
                className="
                  px-3 py-2
                  text-xs
                  font-medium
                  text-rose-400
                  transition
                  hover:text-rose-300
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
                    : 'Solicitar Exclusão'}
              </button>
            </div>
            {/* BOTÕES DE EDIÇÃO */}
            {editando ? (
              <div
                className="
                  flex w-full
                  flex-col gap-3
                  sm:w-auto
                  sm:flex-row
                "
              >
                <button
                  type="button"
                  onClick={cancelarEdicao}
                  disabled={salvando}
                  className="
                    flex items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-900
                    px-5 py-3
                    text-xs
                    font-bold
                    text-slate-300
                    transition
                    hover:bg-slate-800
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    focus:outline-none
                    focus:ring-2
                    focus:ring-slate-500
                  "
                >
                  <X
                    size={15}
                    aria-hidden="true"
                  />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarAlteracoes}
                  disabled={salvando}
                  className="
                    flex items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-emerald-600
                    px-6 py-3
                    text-xs
                    font-bold
                    text-slate-950
                    shadow-md
                    transition-all
                    hover:bg-emerald-500
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    focus:outline-none
                    focus:ring-2
                    focus:ring-emerald-400
                  "
                >
                  {salvando ? (
                    <Loader2
                      size={15}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={15}
                      aria-hidden="true"
                    />
                  )}
                  {salvando
                    ? 'Salvando...'
                    : 'Salvar alterações'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={iniciarEdicao}
                className="
                  flex w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-emerald-600
                  px-6 py-3
                  text-xs
                  font-bold
                  text-slate-950
                  shadow-md
                  transition-all
                  hover:bg-emerald-500
                  active:scale-[0.99]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-emerald-400
                  sm:w-auto
                "
              >
                <FileText
                  size={15}
                  aria-hidden="true"
                />
                Editar informações
              </button>
            )}
          </div>
        </div>
      </div>
      {modalExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-exclusao">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-rose-500/30 bg-slate-900 p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="titulo-exclusao" className="text-lg font-extrabold text-white">Solicitar exclusão da conta</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Sua conta não será apagada imediatamente. A solicitação será registrada para análise e tratamento seguro dos seus dados.
                </p>
              </div>
              <button type="button" onClick={fecharModalExclusao} disabled={solicitandoExclusao} aria-label="Fechar solicitação de exclusão" className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="text-xs leading-5 text-rose-200">
                Registros que precisem ser preservados por obrigação legal, segurança ou auditoria poderão receber tratamento específico antes do encerramento definitivo.
              </p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={fecharModalExclusao} disabled={solicitandoExclusao} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={() => void confirmarSolicitacaoExclusao()} disabled={solicitandoExclusao} className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-60">
                {solicitandoExclusao && <Loader2 size={15} aria-hidden="true" className="animate-spin" />}
                {solicitandoExclusao ? 'Enviando...' : 'Confirmar solicitação'}
              </button>
            </div>
          </div>
        </div>
      )}
      {modalReautenticacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-reauth">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="titulo-reauth" className="text-lg font-extrabold text-white">Confirmar sua identidade</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">Digite sua senha para visualizar CPF e CNS completos.</p>
              </div>
              <button type="button" onClick={fecharReautenticacao} disabled={validandoSenha} aria-label="Fechar confirmação de identidade" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={confirmarReautenticacao}>
              <label htmlFor="senha-reauth" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Senha</label>
              <div className="relative">
                <input id="senha-reauth" type={mostrarSenhaReautenticacao ? 'text' : 'password'} value={senhaReautenticacao} onChange={(e) => setSenhaReautenticacao(e.target.value)} autoComplete="current-password" autoFocus required disabled={validandoSenha} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60" placeholder="Digite sua senha" />
                <button type="button" onClick={() => setMostrarSenhaReautenticacao((valor) => !valor)} disabled={validandoSenha} aria-label={mostrarSenhaReautenticacao ? 'Ocultar senha' : 'Mostrar senha'} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 disabled:opacity-50">
                  {mostrarSenhaReautenticacao ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={fecharReautenticacao} disabled={validandoSenha} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={validandoSenha || !senhaReautenticacao} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
                  {validandoSenha && <Loader2 size={15} aria-hidden="true" className="animate-spin" />}
                  {validandoSenha ? 'Confirmando...' : 'Confirmar e exibir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
