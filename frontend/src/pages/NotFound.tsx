import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020817] px-4 text-slate-200">
      <section className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#126ca8]">Erro 404</p>
        <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Página não encontrada</h1>
        <p className="mt-4 text-base leading-7 text-slate-400">
          O endereço acessado não existe ou pode ter sido alterado. Você pode voltar para a página inicial do EasyVacc e continuar navegando normalmente.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#126ca8] px-5 py-3 font-semibold text-white transition hover:bg-[#105b90]">
            <Home size={18} aria-hidden="true" /> Ir para o início
          </Link>
          <button type="button" onClick={() => window.history.back()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#081629] px-5 py-3 font-semibold text-slate-200 transition hover:bg-slate-800">
            <ArrowLeft size={18} aria-hidden="true" /> Voltar
          </button>
        </div>
        <p className="mt-10 text-sm font-semibold text-slate-500">Easy<span className="text-[#126ca8]">Vacc</span></p>
      </section>
    </main>
  );
}
