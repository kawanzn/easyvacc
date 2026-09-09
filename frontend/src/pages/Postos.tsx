import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Building2, Sparkles, Loader2 } from 'lucide-react';
import { API_URL } from '../lib/api';

export default function Postos() {
  const [postos, setPostos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/postos`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) setPostos(data.dados);
        setCarregando(false);
      })
      .catch((erro) => {
        console.error('Erro ao carregar postos', erro);
        setCarregando(false);
      });
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 antialiased">
      {/* Glow de fundo estilo HealthTech */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-500/10 via-[#00a884]/15 to-cyan-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 pb-20">
        {/* Cabeçalho */}
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-[#00a884]">
            <Sparkles size={13} />
            <span>Rede de Atendimento</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Postos de Saúde e UBS
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Unidades municipais cadastradas para atendimento e vacinação.
          </p>
        </div>

        {/* Conteúdo */}
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-[#00a884]" />
            <p className="mt-3 text-sm font-medium">Carregando unidades de saúde...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {postos.length > 0 ? (
              postos.map((posto) => (
                <div
                  key={posto.id}
                  className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md transition-all hover:border-slate-700 md:flex-row md:items-center md:p-8"
                >
                  <div className="space-y-3">
                    {/* Badge de Status */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                        posto.aberto
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-[#00a884]'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${posto.aberto ? 'bg-[#00a884] animate-pulse' : 'bg-slate-500'}`} />
                      {posto.aberto ? 'Aberto Agora' : 'Funcionamento Regular'}
                    </span>

                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {posto.nome}
                    </h2>

                    <div className="space-y-1.5 pt-1">
                      <p className="flex items-center gap-2 text-sm text-slate-300">
                        <MapPin size={16} className="shrink-0 text-[#00a884]" />
                        <span>{posto.endereco}</span>
                      </p>

                      <p className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock size={16} className="shrink-0 text-[#00a884]" />
                        <span>{posto.horarioFuncionamento || 'Horário não especificado'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-slate-200">
                    <Phone size={16} className="text-[#00a884]" />
                    <span>{posto.telefone || '(22) 2651-0000'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
                <Building2 size={32} className="mx-auto text-slate-600" />
                <p className="mt-2 text-sm font-medium text-slate-400">
                  Nenhum posto encontrado no banco de dados.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}