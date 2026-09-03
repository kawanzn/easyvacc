import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';

export default function Postos() {
  const [postos, setPostos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/postos')
      .then(res => res.json())
      .then(data => {
        if (data.sucesso) setPostos(data.dados);
        setCarregando(false);
      })
      .catch(erro => {
        console.error("Erro ao carregar postos", erro);
        setCarregando(false);
      });
  }, []);
  
  return (
    <div className="p-8 md:p-12 animate-fade-in max-w-5xl mx-auto pb-20">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-800">Postos de Saúde e UBS</h1>
        <p className="text-slate-500 mt-2">Unidades de atendimento cadastradas no sistema municipal de Saquarema.</p>
      </div>

      {carregando ? (
        <div className="text-center py-16 text-slate-400 font-bold">Carregando unidades de saúde...</div>
      ) : (
        <div className="space-y-6">
          {postos.length > 0 ? (
            postos.map((posto) => (
              <div key={posto.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3">
                  {/* Badge de Status Dinâmico */}
                  <span className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${
                    posto.aberto 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {posto.aberto ? '🟢 Aberto Agora' : '⚪ Funcionamento Regular'}
                  </span>

                  <h2 className="text-xl font-bold text-slate-800">{posto.nome}</h2>
                  
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <MapPin size={16} className="text-teal-600 shrink-0" /> {posto.endereco}
                  </p>
                  
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <Clock size={16} className="text-teal-600 shrink-0" /> {posto.horarioFuncionamento || 'Horário não especificado'}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 text-slate-600 text-sm font-bold shrink-0">
                  <Phone size={16} className="text-teal-600" /> {posto.telefone || '(22) 2651-0000'}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-slate-400 font-bold">Nenhum posto encontrado no banco de dados.</div>
          )}
        </div>
      )}
    </div>
  );
}