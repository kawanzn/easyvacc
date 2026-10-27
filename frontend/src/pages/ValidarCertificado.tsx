import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { supabase } from '../services/supabase';

type StatusCertificado = 'valido' | 'revogado' | 'substituido';

interface CertificadoValidado {
  codigo: string;
  status: StatusCertificado;
  valido: boolean;
  emitido_em: string;
  versao: number;
  nome: string;
  tipo_pessoa: string;
  total_vacinas: number;
  substituido_por_codigo: string | null;
}

export default function ValidarCertificado() {
  const [temaClaro, setTemaClaro] = useState(() => localStorage.getItem('easyvacc-tema') === 'claro');
  useEffect(() => {
    const atualizarTema = () => setTemaClaro(localStorage.getItem('easyvacc-tema') === 'claro');
    window.addEventListener('storage', atualizarTema);
    window.addEventListener('easyvacc-tema-atualizado', atualizarTema);
    window.addEventListener('easyvaccTemaAtualizado', atualizarTema);
    return () => {
      window.removeEventListener('storage', atualizarTema);
      window.removeEventListener('easyvacc-tema-atualizado', atualizarTema);
      window.removeEventListener('easyvaccTemaAtualizado', atualizarTema);
    };
  }, []);

  const { codigo } = useParams<{ codigo: string }>();
  const [certificado, setCertificado] =
    useState<CertificadoValidado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function validar() {
      try {
        setCarregando(true);
        setErro('');
        setCertificado(null);

        if (!codigo) {
          throw new Error('Código do certificado não informado.');
        }

        const { data, error } = await supabase.rpc(
          'validar_certificado',
          {
            codigo_busca: codigo,
          }
        );

        if (error) {
          console.error('Erro ao validar certificado:', error);
          throw new Error(
            'Não foi possível validar o certificado.'
          );
        }

        if (!data || data.length === 0) {
          return;
        }

        setCertificado(data[0] as CertificadoValidado);
      } catch (error) {
        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : 'Erro ao validar certificado.'
        );
      } finally {
        setCarregando(false);
      }
    }

    void validar();
  }, [codigo]);

  function formatarDataHora(data: string) {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date(data));
    } catch {
      return 'Data não informada';
    }
  }

  if (carregando) {
    return (
      <div className={`ev-public-page ${temaClaro ? "ev-public-light" : ""} flex min-h-screen items-center justify-center bg-[#090d16] text-white`}>
      <style>{`
        .ev-public-light { background:#f5f9ff !important; color:#102b49 !important; }
        .ev-public-light [class~="bg-[#020817]"],
        .ev-public-light [class~="bg-[#090d16]"] {background:#f5f9ff !important;}
        .ev-public-light [class~="bg-[#081629]"],
        .ev-public-light [class~="bg-[#111827]"],
        .ev-public-light [class~="bg-[#0d1420]"] {background:#fff !important;}
        .ev-public-light [class~="text-white"],
        .ev-public-light [class~="text-slate-100"],
        .ev-public-light [class~="text-slate-200"] {color:#102b49 !important;}
        .ev-public-light [class~="text-slate-300"] {color:#34516e !important;}
        .ev-public-light [class~="text-slate-400"],
        .ev-public-light [class~="text-slate-500"],
        .ev-public-light [class~="text-slate-600"] {color:#526d87 !important;}
        .ev-public-light [class~="border-slate-800"],
        .ev-public-light [class~="border-slate-700"] {border-color:#d1e0ef !important;}
        .ev-public-light input {background:#fff !important; color:#102b49 !important; border-color:#b8ccdf !important;}
        .ev-public-light input::placeholder {color:#647e98 !important;}
        .ev-public-light .text-blue-300,
        .ev-public-light .text-blue-500 {color:#126ca8 !important;}
        .ev-public-light .bg-blue-600\\/10 {background:#e8f3ff !important;}
        .ev-public-light .text-red-300 {color:#b42336 !important;}
        .ev-public-light .text-amber-300 {color:#9b6000 !important;}
        .ev-public-light [class~="bg-[#126ca8]"] {color:white !important;}
        @media(max-width:640px) {
          .ev-public-page > div {max-width:100%;}
          .ev-public-page input {font-size:16px;}
        }
`}</style>
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-blue-500"
          />
          <p className="mt-4 text-sm text-slate-400">
            Validando certificado...
          </p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={`ev-public-page ${temaClaro ? "ev-public-light" : ""} flex min-h-screen items-center justify-center bg-[#090d16] px-6`}>
      <style>{`
        .ev-public-light { background:#f5f9ff !important; color:#102b49 !important; }
        .ev-public-light [class~="bg-[#020817]"],
        .ev-public-light [class~="bg-[#090d16]"] {background:#f5f9ff !important;}
        .ev-public-light [class~="bg-[#081629]"],
        .ev-public-light [class~="bg-[#111827]"],
        .ev-public-light [class~="bg-[#0d1420]"] {background:#fff !important;}
        .ev-public-light [class~="text-white"],
        .ev-public-light [class~="text-slate-100"],
        .ev-public-light [class~="text-slate-200"] {color:#102b49 !important;}
        .ev-public-light [class~="text-slate-300"] {color:#34516e !important;}
        .ev-public-light [class~="text-slate-400"],
        .ev-public-light [class~="text-slate-500"],
        .ev-public-light [class~="text-slate-600"] {color:#526d87 !important;}
        .ev-public-light [class~="border-slate-800"],
        .ev-public-light [class~="border-slate-700"] {border-color:#d1e0ef !important;}
        .ev-public-light input {background:#fff !important; color:#102b49 !important; border-color:#b8ccdf !important;}
        .ev-public-light input::placeholder {color:#647e98 !important;}
        .ev-public-light .text-blue-300,
        .ev-public-light .text-blue-500 {color:#126ca8 !important;}
        .ev-public-light .bg-blue-600\\/10 {background:#e8f3ff !important;}
        .ev-public-light .text-red-300 {color:#b42336 !important;}
        .ev-public-light .text-amber-300 {color:#9b6000 !important;}
        .ev-public-light [class~="bg-[#126ca8]"] {color:white !important;}
        @media(max-width:640px) {
          .ev-public-page > div {max-width:100%;}
          .ev-public-page input {font-size:16px;}
        }
`}</style>
        <div className="w-full max-w-md rounded-2xl border border-red-900/50 bg-[#111827] p-5 sm:p-8 text-center">
          <XCircle
            size={45}
            className="mx-auto text-red-400"
          />
          <h1 className="mt-5 text-xl font-bold text-white">
            Não foi possível validar
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {erro}
          </p>
        </div>
      </div>
    );
  }

  if (!certificado) {
    return (
      <div className={`ev-public-page ${temaClaro ? "ev-public-light" : ""} flex min-h-screen items-center justify-center bg-[#090d16] px-6`}>
      <style>{`
        .ev-public-light { background:#f5f9ff !important; color:#102b49 !important; }
        .ev-public-light [class~="bg-[#020817]"],
        .ev-public-light [class~="bg-[#090d16]"] {background:#f5f9ff !important;}
        .ev-public-light [class~="bg-[#081629]"],
        .ev-public-light [class~="bg-[#111827]"],
        .ev-public-light [class~="bg-[#0d1420]"] {background:#fff !important;}
        .ev-public-light [class~="text-white"],
        .ev-public-light [class~="text-slate-100"],
        .ev-public-light [class~="text-slate-200"] {color:#102b49 !important;}
        .ev-public-light [class~="text-slate-300"] {color:#34516e !important;}
        .ev-public-light [class~="text-slate-400"],
        .ev-public-light [class~="text-slate-500"],
        .ev-public-light [class~="text-slate-600"] {color:#526d87 !important;}
        .ev-public-light [class~="border-slate-800"],
        .ev-public-light [class~="border-slate-700"] {border-color:#d1e0ef !important;}
        .ev-public-light input {background:#fff !important; color:#102b49 !important; border-color:#b8ccdf !important;}
        .ev-public-light input::placeholder {color:#647e98 !important;}
        .ev-public-light .text-blue-300,
        .ev-public-light .text-blue-500 {color:#126ca8 !important;}
        .ev-public-light .bg-blue-600\\/10 {background:#e8f3ff !important;}
        .ev-public-light .text-red-300 {color:#b42336 !important;}
        .ev-public-light .text-amber-300 {color:#9b6000 !important;}
        .ev-public-light [class~="bg-[#126ca8]"] {color:white !important;}
        @media(max-width:640px) {
          .ev-public-page > div {max-width:100%;}
          .ev-public-page input {font-size:16px;}
        }
`}</style>
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-5 sm:p-8 text-center">
          <XCircle
            size={45}
            className="mx-auto text-red-400"
          />
          <h1 className="mt-5 text-xl font-bold text-white">
            Certificado não encontrado
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Não encontramos nenhum certificado EasyVacc
            correspondente a este código.
          </p>
        </div>
      </div>
    );
  }

  const status = certificado.status || (
    certificado.valido ? 'valido' : 'revogado'
  );

  const valido =
    status === 'valido' && certificado.valido;

  const substituido =
    status === 'substituido';

  const revogado =
    status === 'revogado';

  return (
    <div className={`ev-public-page ${temaClaro ? "ev-public-light" : ""} min-h-screen bg-[#090d16] px-5 py-10 text-slate-100`}>
      <style>{`
        .ev-public-light { background:#f5f9ff !important; color:#102b49 !important; }
        .ev-public-light [class~="bg-[#020817]"],
        .ev-public-light [class~="bg-[#090d16]"] {background:#f5f9ff !important;}
        .ev-public-light [class~="bg-[#081629]"],
        .ev-public-light [class~="bg-[#111827]"],
        .ev-public-light [class~="bg-[#0d1420]"] {background:#fff !important;}
        .ev-public-light [class~="text-white"],
        .ev-public-light [class~="text-slate-100"],
        .ev-public-light [class~="text-slate-200"] {color:#102b49 !important;}
        .ev-public-light [class~="text-slate-300"] {color:#34516e !important;}
        .ev-public-light [class~="text-slate-400"],
        .ev-public-light [class~="text-slate-500"],
        .ev-public-light [class~="text-slate-600"] {color:#526d87 !important;}
        .ev-public-light [class~="border-slate-800"],
        .ev-public-light [class~="border-slate-700"] {border-color:#d1e0ef !important;}
        .ev-public-light input {background:#fff !important; color:#102b49 !important; border-color:#b8ccdf !important;}
        .ev-public-light input::placeholder {color:#647e98 !important;}
        .ev-public-light .text-blue-300,
        .ev-public-light .text-blue-500 {color:#126ca8 !important;}
        .ev-public-light .bg-blue-600\\/10 {background:#e8f3ff !important;}
        .ev-public-light .text-red-300 {color:#b42336 !important;}
        .ev-public-light .text-amber-300 {color:#9b6000 !important;}
        .ev-public-light [class~="bg-[#126ca8]"] {color:white !important;}
        @media(max-width:640px) {
          .ev-public-page > div {max-width:100%;}
          .ev-public-page input {font-size:16px;}
        }
`}</style>
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="EasyVacc"
              className="h-11 w-11 rounded-lg bg-white p-1"
            />
            <div>
              <h1 className="text-xl font-bold text-white">
                Easy
                <span className="text-blue-500">
                  Vacc
                </span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Validação pública de documento
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827] shadow-2xl">
          <div className="border-b border-slate-800 p-5 sm:p-8 text-center">
            {valido && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-950/70">
                  <CheckCircle2
                    size={36}
                    className="text-blue-500"
                  />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-white">
                  Certificado válido
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Este documento está registrado e permanece
                  válido no EasyVacc.
                </p>
              </>
            )}

            {substituido && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-950/70">
                  <AlertTriangle
                    size={36}
                    className="text-amber-400"
                  />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-amber-300">
                  Certificado substituído
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Este documento foi substituído por uma versão
                  mais recente e não deve ser considerado a
                  versão atual.
                </p>
              </>
            )}

            {revogado && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-950/70">
                  <XCircle
                    size={36}
                    className="text-red-400"
                  />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-red-300">
                  Certificado revogado
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Este documento existe, porém foi revogado e
                  não está mais válido no EasyVacc.
                </p>
              </>
            )}
          </div>

          <div className="space-y-6 p-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Nome
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {certificado.nome}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Perfil
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {certificado.tipo_pessoa}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Versão
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-200">
                  {certificado.versao}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Situação
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    valido
                      ? 'text-blue-500'
                      : substituido
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }`}
                >
                  {valido
                    ? 'Válido'
                    : substituido
                      ? 'Substituído'
                      : 'Revogado'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Registros atuais
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {certificado.total_vacinas} vacina(s)
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Emitido em
              </p>
              <p className="mt-1 text-sm text-slate-200">
                {formatarDataHora(certificado.emitido_em)}
              </p>
            </div>

            {substituido &&
              certificado.substituido_por_codigo && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-400"
                    />
                    <div>
                      <p className="text-sm font-semibold text-amber-200">
                        Existe uma versão mais recente
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Consulte o documento que substituiu esta
                        versão para verificar sua situação atual.
                      </p>
                      <Link
                        to={`/validar/${certificado.substituido_por_codigo}`}
                        className="mt-3 inline-flex text-xs font-semibold text-blue-500 transition hover:text-blue-300"
                      >
                        Validar versão mais recente
                      </Link>
                    </div>
                  </div>
                </div>
              )}

            <div className="rounded-xl border border-slate-800 bg-[#090d16] p-4">
              <div className="flex items-start gap-3">
                <FileCheck2
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-500"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Código de validação
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-300">
                    {certificado.codigo}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 bg-[#0d1420] px-8 py-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-blue-500"
              />
              <p className="text-xs leading-5 text-slate-400">
                Esta página confirma a existência, versão e
                situação de um documento emitido pelo EasyVacc.
                O certificado representa apenas os registros
                disponíveis na plataforma e não substitui
                cadernetas, comprovantes ou certificados oficiais
                emitidos pelo Ministério da Saúde, SUS ou outros
                órgãos públicos de saúde.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}