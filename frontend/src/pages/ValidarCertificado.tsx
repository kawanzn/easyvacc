import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  FileCheck2,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { supabase } from '../services/supabase';

interface CertificadoValidado {
  codigo: string;
  valido: boolean;
  emitido_em: string;
  nome: string;
  tipo_pessoa: string;
  total_vacinas: number;
}

export default function ValidarCertificado() {
  const { codigo } = useParams<{ codigo: string }>();

  const [certificado, setCertificado] =
    useState<CertificadoValidado | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  useEffect(() => {
    async function validar() {
      try {
        setCarregando(true);
        setErro('');

        if (!codigo) {
          throw new Error(
            'Código do certificado não informado.'
          );
        }

        const { data, error } =
          await supabase.rpc(
            'validar_certificado',
            {
              codigo_busca: codigo,
            }
          );

        if (error) {
          console.error(
            'Erro ao validar certificado:',
            error
          );

          throw new Error(
            'Não foi possível validar o certificado.'
          );
        }

        if (!data || data.length === 0) {
          setCertificado(null);
          return;
        }

        setCertificado(
          data[0] as CertificadoValidado
        );
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

    validar();
  }, [codigo]);

  function formatarData(data: string) {
    return new Intl.DateTimeFormat(
      'pt-BR',
      {
        dateStyle: 'long',
        timeStyle: 'short',
      }
    ).format(new Date(data));
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
            Não encontramos nenhum certificado
            EasyVacc correspondente a este código.
          </p>
        </div>
      </div>
    );
  }

  const valido = certificado.valido;

  return (
    <div className="min-h-screen bg-[#090d16] px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-xl">

        {/* LOGO */}

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
                Validação de documento
              </p>
            </div>
          </div>
        </div>

        {/* STATUS */}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827] shadow-2xl">

          <div className="border-b border-slate-800 p-8 text-center">
            {valido ? (
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

                <p className="mt-2 text-sm text-slate-400">
                  Este documento foi emitido pelo
                  EasyVacc e está registrado no sistema.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-950/70">
                  <XCircle
                    size={36}
                    className="text-red-400"
                  />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-white">
                  Certificado revogado
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Este documento existe, porém não
                  está mais válido no EasyVacc.
                </p>
              </>
            )}
          </div>

          {/* INFORMAÇÕES */}

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
                  Registros
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {certificado.total_vacinas}{' '}
                  vacina(s)
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Emitido em
              </p>

              <p className="mt-1 text-sm text-slate-200">
                {formatarData(
                  certificado.emitido_em
                )}
              </p>
            </div>

            {/* CÓDIGO */}

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

          {/* RODAPÉ */}

          <div className="border-t border-slate-800 bg-[#0d1420] px-8 py-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-emerald-400"
              />

              <p className="text-xs leading-5 text-slate-400">
                Esta página confirma a existência e
                situação de um documento emitido pelo
                EasyVacc. Ela não representa validação
                oficial do Ministério da Saúde.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}