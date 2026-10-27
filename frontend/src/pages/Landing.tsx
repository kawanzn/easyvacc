import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BellRing, CheckCircle2, ChevronDown, FileCheck2,
  Moon, ShieldCheck, Sun, Syringe, Users, X,
} from 'lucide-react';

const perguntas = [
  {
    q: 'O EasyVacc substitui a carteira oficial do SUS?',
    a: 'Não. O EasyVacc oferece uma caderneta digital própria. Os registros individuais são cadastrados na plataforma pelo usuário ou por profissional autorizado e não são importados automaticamente da carteira oficial do SUS ou do SI-PNI.',
  },
  {
    q: 'Quem pode usar o EasyVacc?',
    a: 'Pessoas com CPF podem criar uma conta para organizar a própria caderneta e gerenciar seus dependentes. Profissionais autorizados possuem um acesso separado para registrar aplicações.',
  },
  {
    q: 'Meus dados estão protegidos?',
    a: 'O acesso à conta é protegido por autenticação e os dados pessoais e de saúde possuem controles de acesso. A Política de Privacidade explica como as informações são utilizadas e protegidas.',
  },
];

export default function Landing() {
  const [faqAberta, setFaqAberta] = useState<number | null>(null);
  const [mostrarDuvidas, setMostrarDuvidas] = useState(false);
  const [temaClaro, setTemaClaro] = useState(
    () => localStorage.getItem('easyvacc-tema') === 'claro'
  );

  useEffect(() => {
    const atualizarTema = () =>
      setTemaClaro(localStorage.getItem('easyvacc-tema') === 'claro');
    window.addEventListener('storage', atualizarTema);
    window.addEventListener('easyvacc-tema-atualizado', atualizarTema);
    window.addEventListener('easyvaccTemaAtualizado', atualizarTema);
    return () => {
      window.removeEventListener('storage', atualizarTema);
      window.removeEventListener('easyvacc-tema-atualizado', atualizarTema);
      window.removeEventListener('easyvaccTemaAtualizado', atualizarTema);
    };
  }, []);

  const alternarTema = () => {
    const proximo = localStorage.getItem('easyvacc-tema') !== 'claro';
    localStorage.setItem('easyvacc-tema', proximo ? 'claro' : 'escuro');
    setTemaClaro(proximo);
    window.dispatchEvent(new Event('easyvacc-tema-atualizado'));
    window.dispatchEvent(new Event('easyvaccTemaAtualizado'));
  };

  return (
    <div className={`relative flex min-h-[100dvh] flex-col overflow-x-hidden font-sans antialiased transition-colors duration-300 ${
      temaClaro ? 'bg-[#f8fbff] text-[#102b49]' : 'bg-[#020817] text-white'
    }`}>
      {/* Navegação limpa, sem borda ao redor da marca. */}
      <header className={`relative z-20 border-b ${
        temaClaro ? 'border-[#e5edf6]' : 'border-white/10'
      }`}>
        <div className="mx-auto flex h-[76px] w-full max-w-[1380px] items-center justify-between gap-3 px-5 sm:px-8 lg:px-12">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1478b8]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.12)] ring-1 ring-white/30">
              <img src="/logo.png" alt="Logo EasyVacc" className="h-full w-full object-contain" />
            </span>
            <span className="whitespace-nowrap text-[21px] font-extrabold tracking-[-0.05em] sm:text-2xl">
              Easy<span className="text-[#1478b8]">Vacc</span>
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="flex shrink-0 items-center gap-2 sm:gap-5">
            <button type="button" onClick={() => setMostrarDuvidas(true)}
              className={`hidden text-sm font-semibold transition hover:text-[#1478b8] sm:inline-flex ${
                temaClaro ? 'text-[#52677e]' : 'text-[#b6c9df]'
              }`}>
              Dúvidas
            </button>
            <button type="button" onClick={alternarTema}
              aria-label={temaClaro ? 'Ativar modo escuro' : 'Ativar modo claro'}
              title={temaClaro ? 'Ativar modo escuro' : 'Ativar modo claro'}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1478b8] ${
                temaClaro
                  ? 'border-[#d5e2f0] bg-white text-[#1e4771] hover:bg-[#edf5ff]'
                  : 'border-[#314b6b] bg-[#0d2039] text-[#d4e8ff] hover:bg-[#173250]'
              }`}>
              {temaClaro ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <Link to="/login" className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-bold transition sm:px-6 ${
              temaClaro
                ? 'border-[#d4e2f0] bg-white text-[#12385c] hover:bg-[#edf5ff]'
                : 'border-[#395373] bg-[#10243e] text-white hover:bg-[#183757]'
            }`}>
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero inspirado na referência: área editorial à esquerda, formas grandes à direita e celular em destaque. */}
      <main className="relative flex flex-1 items-center overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className={`absolute inset-y-0 right-0 w-full lg:w-[59%] ${temaClaro ? 'bg-[#e8f1ff]' : 'bg-[#07172d]'}`} />
          <div className="absolute -right-[14%] -top-[26%] h-[95%] w-[88%] rotate-[-24deg] rounded-[100px] bg-[#126ca8] lg:right-[-10%] lg:top-[-35%] lg:h-[125%] lg:w-[62%] lg:rounded-[160px]" />
          <div className="absolute -right-[15%] bottom-[-52%] h-[78%] w-[75%] rotate-[-28deg] rounded-[110px] bg-[#3c9fe4] lg:right-[-8%] lg:bottom-[-65%] lg:w-[59%]" />
          <div className="absolute right-[29%] top-[-28%] hidden h-[70%] w-[24%] rotate-[34deg] rounded-[100px] bg-[#78b8f4]/80 lg:block" />
          <div className={`absolute bottom-[-16%] left-[-13%] h-[43%] w-[35%] rounded-full blur-[1px] ${temaClaro ? 'bg-[#dce7ff]' : 'bg-[#112f52]'}`} />
        </div>

        <div className="relative mx-auto grid w-full max-w-[1380px] items-center gap-10 px-5 py-12 sm:px-8 lg:min-h-[min(750px,calc(100dvh-140px))] lg:grid-cols-[48%_52%] lg:gap-0 lg:px-12 lg:py-6">
          <section className="relative z-10 max-w-[580px] lg:pr-7">
            <div className={`mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${temaClaro ? 'border-[#cbdff4] bg-white/80 text-[#126ca8]' : 'border-[#2b547c] bg-[#102a47] text-[#a6d9ff]'}`}>
              <span className="h-2 w-2 rounded-full bg-[#1478b8]" /> Caderneta digital de vacinação
            </div>
            <h1 className="text-[clamp(3rem,5.5vw,5.8rem)] font-extrabold leading-[1.02] tracking-[-0.07em]">
              Sua saúde.<br />
              <span className="text-[#1478b8]">Seu cuidado.</span><br />
              Seu EasyVacc.
            </h1>
            <p className={`mt-7 max-w-[460px] text-base leading-8 sm:text-lg ${temaClaro ? 'text-[#53677f]' : 'text-[#c0d2e5]'}`}>
              Organize sua vacinação e a da sua família de um jeito simples, bonito e digital.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/cadastro" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#126ca8] px-7 text-sm font-bold text-white shadow-[0_15px_32px_rgba(18,108,168,0.25)] transition hover:-translate-y-0.5 hover:bg-[#105b90]">
                Começar agora <ArrowRight size={18} />
              </Link>
              <Link to="/login" className={`inline-flex min-h-12 items-center rounded-full border px-7 text-sm font-bold transition ${temaClaro ? 'border-[#bfd6ed] bg-white/80 text-[#24476b] hover:bg-white' : 'border-[#375a7b] bg-[#0a213a]/80 text-white hover:bg-[#143554]'}`}>
                Já tenho conta
              </Link>
            </div>
            <p className={`mt-9 flex items-center gap-2 text-xs ${temaClaro ? 'text-[#71849b]' : 'text-[#b0c4db]'}`}>
              <ShieldCheck size={16} className="text-[#1478b8]" /> Seus registros em um só lugar
            </p>
          </section>

          {/* Celular central, como na referência enviada. Mockup ilustrativo, sem dados reais. */}
          <section aria-label="Demonstração ilustrativa do aplicativo EasyVacc" className="relative z-10 flex min-h-[480px] items-center justify-center lg:min-h-[590px]">
            <div className="absolute inset-x-[14%] bottom-[8%] h-[10%] rounded-full bg-[#001b3b]/30 blur-3xl" />
            <div className="absolute right-[0%] top-[10%] hidden rotate-12 rounded-2xl border border-white/25 bg-white/15 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-xl sm:block">
              <span className="flex items-center gap-2"><ShieldCheck size={19} /> Caderneta digital</span>
            </div>
            <div className="relative w-[258px] rotate-[7deg] rounded-[45px] border-[8px] border-[#101a2b] bg-[#101a2b] p-[5px] shadow-[18px_34px_65px_rgba(0,17,43,0.4)] transition-transform duration-500 hover:rotate-[2deg] sm:w-[300px]">
              <div className="absolute left-1/2 top-[13px] z-20 h-[23px] w-[90px] -translate-x-1/2 rounded-full bg-[#101a2b]" />
              <div className="relative min-h-[495px] overflow-hidden rounded-[32px] bg-[#f6faff] text-[#102b49] sm:min-h-[560px]">
                <div className="bg-[linear-gradient(135deg,#0d457b,#1478b8)] px-5 pb-12 pt-12 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><img src="/logo.png" alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-1" /><span className="text-sm font-extrabold">EasyVacc</span></div>
                    <BellRing size={18} className="text-[#d6edff]" />
                  </div>
                  <p className="mt-9 text-xs text-[#c7e5ff]">Olá, bem-vindo(a)!</p>
                  <p className="mt-1 text-2xl font-extrabold">Minha caderneta</p>
                  <p className="mt-1 text-[11px] text-[#d3eaff]">Tudo sobre sua vacinação</p>
                </div>
                <div className="relative -mt-6 px-4">
                  <div className="rounded-2xl bg-white p-4 shadow-[0_8px_25px_rgba(20,67,110,0.13)]">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold">Meu histórico</span><span className="rounded-full bg-[#e4f2ff] px-2 py-1 text-[10px] font-bold text-[#126ca8]">Organizado</span></div>
                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#edf5ff] p-3"><span className="rounded-lg bg-[#d8eaff] p-2 text-[#126ca8]"><Syringe size={18} /></span><div><p className="text-xs font-bold">Vacinação</p><p className="text-[10px] text-[#64748b]">Seus registros digitais</p></div><CheckCircle2 size={17} className="ml-auto text-[#126ca8]" /></div>
                  </div>
                  <p className="mt-6 text-xs font-extrabold">Acesso rápido</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#dce8f5] bg-white p-3"><FileCheck2 size={21} className="text-[#126ca8]" /><p className="mt-3 text-[11px] font-bold">Certificados</p></div>
                    <div className="rounded-xl border border-[#dce8f5] bg-white p-3"><Users size={21} className="text-[#126ca8]" /><p className="mt-3 text-[11px] font-bold">Dependentes</p></div>
                  </div>
                  <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#e9f4ff] p-3 text-[10px] font-semibold text-[#285276]"><ShieldCheck size={16} className="text-[#126ca8]" /> Mais praticidade para você</div>
                </div>
              </div>
            </div>
            <div className={`absolute bottom-[12%] left-[0%] hidden -rotate-6 items-center gap-2 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl sm:flex ${temaClaro ? 'border-white/70 bg-white/95 text-[#24476b]' : 'border-white/20 bg-[#0b2543]/90 text-white'}`}>
              <span className="rounded-xl bg-[#e8f3ff] p-2 text-[#126ca8]"><Users size={19} /></span>
              <span className="text-xs font-bold">Você e sua família</span>
            </div>
          </section>
        </div>
      </main>

      <footer className={`relative z-10 border-t ${temaClaro ? 'border-[#e5edf6]' : 'border-white/10'}`}>
        <div className={`mx-auto flex min-h-[62px] max-w-[1380px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-3 text-xs sm:justify-between sm:px-8 lg:px-12 ${
          temaClaro ? 'text-[#62788f]' : 'text-[#9fb4ce]'
        }`}>
          <span>© {new Date().getFullYear()} EasyVacc · Caderneta digital independente</span>
          <div className="flex flex-wrap items-center gap-5">
            <button type="button" onClick={() => setMostrarDuvidas(true)} className="hover:text-[#1478b8] sm:hidden">Dúvidas</button>
            <Link to="/privacidade" className="hover:text-[#1478b8]">Privacidade</Link>
            <Link to="/termos" className="hover:text-[#1478b8]">Termos de uso</Link>
          </div>
        </div>
      </footer>

      {/* FAQ discreto em janela, acessível sem aumentar a altura da landing. */}
      {mostrarDuvidas && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setMostrarDuvidas(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="titulo-duvidas"
            className={`w-full max-w-xl rounded-[26px] border p-5 shadow-2xl sm:p-7 ${
              temaClaro ? 'border-[#dbe7f3] bg-white text-[#102b49]' : 'border-[#2c4665] bg-[#0b1d33] text-white'
            }`}>
            <div className="flex items-center justify-between gap-4">
              <h2 id="titulo-duvidas" className="text-xl font-extrabold">Perguntas frequentes</h2>
              <button type="button" onClick={() => setMostrarDuvidas(false)} aria-label="Fechar dúvidas"
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  temaClaro ? 'bg-[#edf4fc] text-[#24476b]' : 'bg-[#193451] text-white'
                }`}><X size={18} /></button>
            </div>
            <div className="mt-5 space-y-2">
              {perguntas.map((item, i) => (
                <div key={item.q} className={`overflow-hidden rounded-xl border ${
                  temaClaro ? 'border-[#e1ebf5]' : 'border-[#2c4665]'
                }`}>
                  <button type="button" onClick={() => setFaqAberta(faqAberta === i ? null : i)}
                    aria-expanded={faqAberta === i} aria-controls={`faq-${i}`}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-semibold">
                    {item.q}
                    <ChevronDown size={18} className={`shrink-0 transition-transform ${faqAberta === i ? 'rotate-180' : ''}`} />
                  </button>
                  {faqAberta === i && (
                    <p id={`faq-${i}`} className={`border-t px-4 py-4 text-sm leading-6 ${
                      temaClaro ? 'border-[#e1ebf5] text-[#52677e]' : 'border-[#2c4665] text-[#b7cbe0]'
                    }`}>{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
