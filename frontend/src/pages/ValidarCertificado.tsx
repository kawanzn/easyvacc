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
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] text-white">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-emerald-400"
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
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-900/50 bg-[#111827] p-8 text-center">
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
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-8 text-center">
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
    <div className="min-h-screen bg-[#090d16] px-5 py-10 text-slate-100">
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
                <span className="text-emerald-400">
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
          <div className="border-b border-slate-800 p-8 text-center">
            {valido && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/70">
                  <CheckCircle2
                    size={36}
                    className="text-emerald-400"
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
                      ? 'text-emerald-400'
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
                        className="mt-3 inline-flex text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
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
                  className="mt-0.5 shrink-0 text-emerald-400"
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
                className="mt-0.5 shrink-0 text-emerald-400"
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