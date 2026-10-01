import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  ChevronDown,
  FileCheck,
  MapPin,
  QrCode,
  ShieldCheck,
  Users,
  Megaphone,
  Moon,
  Sun,
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
const funcionalidades = [
  {
    icon: FileCheck,
    titulo: 'Histórico de vacinação',
    descricao: 'Doses, datas, lotes e fabricantes organizados na sua caderneta.',
  },
  {
    icon: Users,
    titulo: 'Toda a família',
    descricao: 'Cadernetas do titular e dos dependentes reunidas no mesmo acesso.',
  },
  {
    icon: BellRing,
    titulo: 'Próximas doses',
    descricao: 'Acompanhe retornos e próximas aplicações cadastradas.',
  },
  {
    icon: QrCode,
    titulo: 'Certificado digital',
    descricao: 'Gere um documento EasyVacc com QR Code para validação.',
  },
  {
    icon: Megaphone,
    titulo: 'Campanhas',
    descricao: 'Consulte campanhas de vacinação com informações de fonte oficial.',
  },
  {
    icon: MapPin,
    titulo: 'Postos de saúde',
    descricao: 'Encontre unidades de saúde próximas a você.',
  },
];
export default function Landing() {
  const [faqAberta, setFaqAberta] = useState<number | null>(null);
  const [temaClaro, setTemaClaro] = useState(() => {
    return localStorage.getItem('easyvacc-tema') === 'claro';
  });

  const alternarTema = () => {
    setTemaClaro((atual) => {
      const novoTemaClaro = !atual;
      localStorage.setItem('easyvacc-tema', novoTemaClaro ? 'claro' : 'escuro');
      return novoTemaClaro;
    });
  };
  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        temaClaro ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden">
        <div className="mx-auto h-[520px] w-full max-w-6xl bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl" />
      </div>
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${
          temaClaro ? 'border-slate-200 bg-white/90' : 'border-slate-800/60 bg-slate-950/90'
        }`}>
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex min-h-11 items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884]"
          >
            <img src="/logo.png" alt="EasyVacc" className="h-9 w-9 object-contain" />
            <span className={`text-xl font-bold tracking-tight ${temaClaro ? 'text-slate-900' : 'text-white'}`}>
              Easy<span className="text-[#00a884]">Vacc</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-4" aria-label="Navegação principal">
            <a
              href="#funcionalidades"
              className={`hidden min-h-11 items-center px-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#00a884] sm:inline-flex ${
                temaClaro ? 'text-slate-600 hover:text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Funcionalidades
            </a>
            <a
              href="#faq"
              className={`hidden min-h-11 items-center px-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#00a884] md:inline-flex ${
                temaClaro ? 'text-slate-600 hover:text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Dúvidas
            </a>
            <button
              type="button"
              onClick={alternarTema}
              aria-label={temaClaro ? 'Ativar modo escuro' : 'Ativar modo claro'}
              title={temaClaro ? 'Modo escuro' : 'Modo claro'}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-[#00a884] ${
                temaClaro
                  ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'border-slate-700 bg-slate-900 text-amber-300 hover:bg-slate-800'
              }`}
            >
              {temaClaro ? <Moon size={19} aria-hidden="true" /> : <Sun size={19} aria-hidden="true" />}
            </button>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#00a884] px-4 text-sm font-bold text-slate-950 transition hover:bg-[#00c49a] focus:outline-none focus:ring-2 focus:ring-white sm:px-5"
            >
              Entrar
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="relative px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-[#00a884]">
                Caderneta digital de vacinação
              </p>
              <h1 className={`max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.08] ${temaClaro ? 'text-slate-950' : 'text-white'}`}>
                Sua vacinação, organizada em um só lugar.
              </h1>
              <p className={`mt-6 max-w-xl text-lg leading-8 ${temaClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                Acompanhe seu histórico de vacinação e o de seus dependentes,
                consulte próximas doses e mantenha sua caderneta organizada.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/cadastro"
                  className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-gradient-to-r from-[#00a884] to-teal-500 px-6 text-base font-bold text-slate-950 shadow-lg shadow-[#00a884]/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Criar minha caderneta
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className={`inline-flex min-h-12 items-center rounded-xl border px-6 text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#00a884] ${temaClaro ? 'border-slate-300 text-slate-800 hover:bg-slate-100' : 'border-slate-700 text-white hover:bg-slate-900'}`}
                >
                  Já tenho conta
                </Link>
              </div>
              <p className={`mt-5 max-w-xl text-xs leading-5 ${temaClaro ? 'text-slate-600' : 'text-slate-500'}`}>
                O EasyVacc é uma caderneta digital própria e não substitui documentos
                oficiais emitidos pelo Ministério da Saúde ou pelo SUS.
              </p>
            </div>
            <div className="mx-auto w-full max-w-md">
              <div className={`rounded-3xl border p-5 transition-colors ${temaClaro ? 'border-slate-200 bg-white shadow-[0_12px_45px_rgba(15,23,42,0.15)]' : 'border-white/25 bg-gradient-to-br from-slate-900 via-slate-900 to-[#00a884]/10 shadow-[0_0_55px_rgba(255,255,255,0.22)]'}`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#00a884]/40 bg-[#00a884]/15 shadow-lg shadow-[#00a884]/10">
                      <img src="/logo.png" alt="" className="h-7 w-7 object-contain drop-shadow-[0_0_7px_rgba(0,168,132,0.4)]" />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${temaClaro ? 'text-slate-600' : 'text-slate-400'}`}>Caderneta digital</p>
                      <p className={`font-bold ${temaClaro ? 'text-slate-950' : 'text-white'}`}>Exemplo de titular</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#00a884]/40 bg-[#00a884]/10 px-2.5 py-1 text-[11px] font-semibold text-teal-300">
                    Demonstração
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className={`rounded-2xl border p-4 ${
                      temaClaro ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/50'
                    }`}>
                    <FileCheck className="text-[#00a884]" size={20} aria-hidden="true" />
                    <p className={`mt-3 text-sm font-bold ${temaClaro ? 'text-slate-900' : 'text-white'}`}>Histórico</p>
                    <p className={`mt-1 text-xs leading-5 ${temaClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                      Registros organizados
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${
                      temaClaro ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/50'
                    }`}>
                    <BellRing className="text-amber-400" size={20} aria-hidden="true" />
                    <p className={`mt-3 text-sm font-bold ${temaClaro ? 'text-slate-900' : 'text-white'}`}>Próximas doses</p>
                    <p className={`mt-1 text-xs leading-5 ${temaClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                      Acompanhe retornos
                    </p>
                  </div>
                </div>
                <div className={`mt-3 flex items-center gap-3 rounded-2xl border p-4 ${
                    temaClaro ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/30'
                  }`}>
                  <ShieldCheck className="shrink-0 text-cyan-400" size={21} aria-hidden="true" />
                  <p className={`text-sm leading-6 ${temaClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                    Acesso protegido aos dados da sua caderneta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="funcionalidades"
          className={`border-y py-16 sm:py-20 ${temaClaro ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/30'}`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#00a884]">
                Funcionalidades
              </p>
              <h2 className={`mt-3 text-3xl font-bold tracking-tight ${temaClaro ? 'text-slate-950' : 'text-white'}`}>
                O essencial para acompanhar sua vacinação
              </h2>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {funcionalidades.map((item) => (
                <div
                  key={item.titulo}
                  className={`rounded-2xl border p-4 transition-colors ${temaClaro ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-slate-900/70'}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00a884]/10">
                    <item.icon className="text-[#00a884]" size={19} aria-hidden="true" />
                  </div>
                  <h3 className={`mt-3 text-sm font-bold ${temaClaro ? 'text-slate-900' : 'text-white'}`}>{item.titulo}</h3>
                  <p className={`mt-1.5 text-sm leading-5 ${temaClaro ? 'text-slate-600' : 'text-slate-400'}`}>{item.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className={`mx-auto grid max-w-5xl items-center gap-8 rounded-3xl border p-6 sm:p-8 md:grid-cols-[auto_1fr] ${
              temaClaro ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-slate-900/60'
            }`}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00a884]/10">
              <MapPin className="text-[#00a884]" size={26} aria-hidden="true" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${temaClaro ? 'text-slate-950' : 'text-white'}`}>
                Informações com origem transparente
              </h2>
              <p className={`mt-2 text-sm leading-7 ${temaClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                As campanhas exibidas são sincronizadas a partir de informações do
                Ministério da Saúde e os dados de estabelecimentos de saúde utilizam o
                CNES. Os registros pessoais da caderneta são cadastrados no EasyVacc e
                não são importados automaticamente da carteira oficial do SUS.
              </p>
            </div>
          </div>
        </section>
        <section
          id="faq"
          className={`border-y py-16 sm:py-20 ${temaClaro ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/30'}`}
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#00a884]">
                Dúvidas
              </p>
              <h2 className={`mt-3 text-3xl font-bold ${temaClaro ? 'text-slate-950' : 'text-white'}`}>Perguntas frequentes</h2>
            </div>
            <div className="mt-8 space-y-3">
              {perguntas.map((item, i) => {
                const aberta = faqAberta === i;
                return (
                  <div
                    key={item.q}
                    className={`overflow-hidden rounded-2xl border ${temaClaro ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setFaqAberta(aberta ? null : i)}
                      aria-expanded={aberta}
                      aria-controls={`faq-${i}`}
                      className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00a884]"
                    >
                      <span className={`font-semibold ${temaClaro ? 'text-slate-900' : 'text-white'}`}>{item.q}</span>
                      <ChevronDown
                        size={19}
                        aria-hidden="true"
                        className={`shrink-0 text-slate-400 transition-transform ${
                          aberta ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {aberta && (
                      <p
                        id={`faq-${i}`}
                        className={`border-t px-5 py-4 text-sm leading-7 ${temaClaro ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-300'}`}
                      >
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-3xl border border-[#00a884]/20 bg-gradient-to-br from-[#00a884]/10 to-cyan-500/5 px-6 py-10 text-center sm:px-10">
            <h2 className={`text-3xl font-bold tracking-tight ${temaClaro ? 'text-slate-950' : 'text-white'}`}>
              Comece a organizar sua vacinação
            </h2>
            <p className={`mx-auto mt-3 max-w-xl text-base leading-7 ${temaClaro ? 'text-slate-600' : 'text-slate-300'}`}>
              Crie sua caderneta digital e mantenha os registros da sua família organizados em um só lugar.
            </p>
            <Link
              to="/cadastro"
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#00a884] px-6 text-base font-bold text-slate-950 transition hover:bg-[#00c49a] focus:outline-none focus:ring-2 focus:ring-white"
            >
              Criar minha caderneta
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <footer className={`border-t py-8 ${temaClaro ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950'}`}>
        <div className={`mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm sm:flex-row sm:px-6 lg:px-8 ${temaClaro ? 'text-slate-600' : 'text-slate-400'}`}>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
            <span className={`font-semibold ${temaClaro ? 'text-slate-900' : 'text-white'}`}>EasyVacc</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/privacidade"
              className="inline-flex min-h-11 items-center font-semibold text-[#00a884] hover:underline focus:outline-none focus:ring-2 focus:ring-[#00a884]"
            >
              Política de privacidade
            </Link>
            <Link
              to="/termos"
              className="inline-flex min-h-11 items-center font-semibold text-[#00a884] hover:underline focus:outline-none focus:ring-2 focus:ring-[#00a884]"
            >
              Termos de uso
            </Link>
          </div>
          <p>© {new Date().getFullYear()} EasyVacc</p>
        </div>
      </footer>
    </div>
  );
}
