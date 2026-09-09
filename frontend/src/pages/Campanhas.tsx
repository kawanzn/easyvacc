import { useState, useEffect } from 'react';
import { Calendar, Megaphone, Sparkles, Loader2 } from 'lucide-react';
import { API_URL } from '../lib/api';

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/campanhas`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) setCampanhas(data.dados);
        setCarregando(false);
      })
      .catch((erro) => {
        console.error('Erro ao carregar campanhas', erro);
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
            <span>Informativo Geral</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Campanhas de Vacinação
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Calendários e ações oficiais de imunização integrados ao servidor.
          </p>
        </div>

        {/* Conteúdo */}
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-[#00a884]" />
            <p className="mt-3 text-sm font-medium">Carregando campanhas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {campanhas.length > 0 ? (
              campanhas.map((campanha) => (
                <div
                  key={campanha.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md transition-all hover:border-slate-700 hover:shadow-2xl"
                >
                  <div className="relative flex h-40 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 p-6 border-b border-slate-800">
                    <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-[#00a884]/10 blur-2xl group-hover:bg-[#00a884]/20 transition-all" />

                    <div className="flex items-center justify-between z-10">
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-[#00a884] backdrop-blur-md">
                        {campanha.status || 'Ativa'}
                      </span>
                      <Megaphone size={20} className="text-[#00a884] opacity-80" />
                    </div>

                    <h2 className="z-10 text-xl font-bold text-white tracking-tight">
                      {campanha.titulo}
                    </h2>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                    <p className="text-sm leading-relaxed text-slate-300">
                      {campanha.descricao}
                    </p>

                    <div className="flex items-center gap-2 border-t border-slate-800/80 pt-4 text-xs font-medium text-slate-400">
                      <Calendar size={15} className="text-[#00a884]" />
                      <span>
                        Período: <strong className="text-slate-200">{campanha.dataInicio}</strong> até <strong className="text-slate-200">{campanha.dataFim}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
                Nenhuma campanha ativa no momento.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}