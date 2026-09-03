import { useState, useEffect } from 'react';
export default function Campanhas() {
  const [campanhas, setCampanhas] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/campanhas')
      .then(res => res.json())
      .then(data => {
        if (data.sucesso) setCampanhas(data.dados);
      })
      .catch(erro => console.error("Erro ao carregar campanhas", erro));
  }, []);
  
  return (
    <div className="p-8 md:p-12 animate-fade-in max-w-5xl mx-auto pb-20">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-800">Campanhas de Vacinação</h1>
        <p className="text-slate-500 mt-2">Calendários oficiais de imunização obtidos via API do servidor.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campanhas.map((campanha) => (
          <div key={campanha.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
            <div className="h-40 bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex flex-col justify-between text-white relative overflow-hidden">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold w-max">
                {campanha.status}
              </span>
              <h2 className="text-xl font-black">{campanha.titulo}</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">{campanha.descricao}</p>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>📅 Período: {campanha.dataInicio} até {campanha.dataFim}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}