interface CartaoVacinaProps {
  nome: string;
  tipo: string;
  status: 'Aplicada' | 'Agendada' | 'Atrasada';
  data: string;
  lote?: string; 
}

export default function CartaoVacina({ nome, tipo, status, data, lote }: CartaoVacinaProps) {
  
  const coresStatus = {
    Aplicada: 'bg-green-100 text-green-800',
    Agendada: 'bg-blue-100 text-blue-800',
    Atrasada: 'bg-red-100 text-red-800',
  };

  const coresBorda = {
    Aplicada: 'border-l-green-500',
    Agendada: 'border-l-blue-500',
    Atrasada: 'border-l-red-500',
  };

  return (
    <article className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-200 border-l-4 ${coresBorda[status]} transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-slate-800">{nome}</h3>
          <p className="text-sm text-slate-500">{tipo}</p>
        </div>
        <span className={`${coresStatus[status]} text-xs font-bold px-3 py-1 rounded-full`}>
          {status}
        </span>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Data</p>
          <p className="font-medium text-slate-700">{data}</p>
        </div>
        
        {lote && (
          <div className="text-right">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Lote</p>
            <p className="font-medium text-slate-700">{lote}</p>
          </div>
        )}
      </div>
    </article>
  );
}